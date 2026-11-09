"""Honest Label scan bridge (preview-only dev tool).

Adapted from GHOST's webcam bridge: keeps the local WebSocket server and the
threaded webcam grabber; hand tracking, rooms and lessons were removed.

Flow:
  Lens  -> {"type": "scan"}                       over ws://127.0.0.1:8765
  bridge grabs the newest webcam frame (or the --image photo), sends it to Gemini
  bridge -> {"type": "scan_result", "source": "live", ...}   to every connected Lens
         or {"type": "scan_error", "error": "..."}           on failure or timeout

Testing without the Lens:
  press S in the bridge window to scan and print the JSON, Q to quit.
  python test_client.py  acts like the Lens over the WebSocket.

Key comes from GEMINI_API_KEY in the environment only (run.sh / run.ps1 load
credentials.env for you). Never commit credentials.env.
"""
import argparse, asyncio, json, os, sys, threading, time

import websockets

import gemini

HOST, PORT = "127.0.0.1", 8765
SCAN_TIMEOUT_S = float(os.environ.get("SCAN_TIMEOUT_S", "8"))

SYSTEM_PROMPT = (
    "You are Honest Label. Read ONLY what is printed on this product's packaging. "
    "Return JSON only: name (generic, no brand names), sugar_g per serving or per container "
    "as printed (null if not visible), serving, up to 2 front-of-pack marketing claims with a "
    "plain-words truth (max 15 words each), verdict (max 15 words, factual, no brand names), "
    "confidence 'label' if read from the nutrition panel else 'estimate'. Never guess numbers."
)
USER_PROMPT = (
    "Read this product's packaging. Return exactly this JSON shape: "
    '{"name": string, "sugar_g": number or null, "serving": string, '
    '"claims": [{"claim": string, "truth": string}], "verdict": string, '
    '"confidence": "label" or "estimate"}'
)

clients = set()


# ---------------------------------------------------------------- frames

MAX_SIDE = int(os.environ.get("SCAN_MAX_SIDE", "896"))


def shrink(cv2, img):
    """Downscale so the longest side is MAX_SIDE px: smaller upload, faster Gemini reply."""
    h, w = img.shape[:2]
    m = max(h, w)
    if m <= MAX_SIDE:
        return img
    k = MAX_SIDE / m
    return cv2.resize(img, (int(w * k), int(h * k)), interpolation=cv2.INTER_AREA)


class Grabber(threading.Thread):
    """Reads the webcam nonstop on its own thread and keeps only the newest frame."""
    def __init__(self):
        super().__init__(daemon=True)
        import cv2
        self.cv2 = cv2
        backend = cv2.CAP_DSHOW if sys.platform == "win32" else (
            cv2.CAP_AVFOUNDATION if sys.platform == "darwin" else cv2.CAP_ANY)
        self.cap = cv2.VideoCapture(int(os.environ.get("SCAN_CAM", "0")), backend)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.frame, self.lock = None, threading.Lock()

    def opened(self):
        return self.cap.isOpened()

    def run(self):
        while True:
            ok, f = self.cap.read()
            if ok:
                with self.lock:
                    self.frame = f
            else:
                time.sleep(0.01)

    def jpeg(self, quality=85):
        with self.lock:
            f = self.frame
        if f is None:
            return None
        f = shrink(self.cv2, f)
        ok, buf = self.cv2.imencode(".jpg", f, [self.cv2.IMWRITE_JPEG_QUALITY, quality])
        return buf.tobytes() if ok else None


class ImageSource:
    """Serves one saved photo instead of the webcam (--image)."""
    def __init__(self, path):
        self.path = path
        self.data = self._load(path)

    @staticmethod
    def _load(path):
        try:
            import cv2
            img = cv2.imread(path)
            if img is not None:
                img = shrink(cv2, img)
                ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])
                if ok:
                    return buf.tobytes()
        except ImportError:
            pass
        with open(path, "rb") as f:  # already a JPEG, or no OpenCV available
            return f.read()

    def opened(self):
        return bool(self.data)

    def start(self):
        pass

    def jpeg(self, quality=85):
        return self.data


source = None


# ---------------------------------------------------------------- validation

def _words(s, n):
    w = str(s).split()
    return " ".join(w[:n])


def validate(raw_text):
    """Parse Gemini's reply and coerce it into the scan_result shape, or raise ValueError."""
    t = (raw_text or "").strip()
    if t.startswith("```"):
        t = t.strip("`")
        t = t[t.find("{"):]
    try:
        d = json.loads(t)
    except ValueError:
        s, e = t.find("{"), t.rfind("}")
        if s < 0 or e <= s:
            raise ValueError("Gemini did not return JSON")
        d = json.loads(t[s:e + 1])
    if isinstance(d, list) and d:
        d = d[0]
    if not isinstance(d, dict):
        raise ValueError("Gemini JSON is not an object")

    name = str(d.get("name") or "").strip()
    if not name:
        raise ValueError("missing name")

    sugar = d.get("sugar_g")
    if isinstance(sugar, str):
        num = "".join(c for c in sugar if c.isdigit() or c == ".")
        sugar = float(num) if num else None
    if isinstance(sugar, bool) or not isinstance(sugar, (int, float)) or sugar < 0:
        sugar = None
    if isinstance(sugar, float) and sugar.is_integer():
        sugar = int(sugar)

    claims = []
    for c in (d.get("claims") or [])[:2]:
        if isinstance(c, dict) and c.get("claim") and c.get("truth"):
            claims.append({"claim": _words(c["claim"], 15), "truth": _words(c["truth"], 15)})

    verdict = _words(d.get("verdict") or "", 15)
    if not verdict:
        raise ValueError("missing verdict")

    conf = str(d.get("confidence") or "").lower()
    if conf not in ("label", "estimate"):
        conf = "estimate"
    if sugar is None:
        conf = "estimate"

    return {
        "type": "scan_result",
        "source": "live",
        "name": name,
        "sugar_g": sugar,
        "serving": str(d.get("serving") or "").strip(),
        "claims": claims,
        "verdict": verdict,
        "confidence": conf,
    }


# ---------------------------------------------------------------- scanning

async def scan():
    img = source.jpeg()
    if img is None:
        return {"type": "scan_error", "error": "no webcam frame yet"}
    t0 = time.time()
    try:
        text = await asyncio.wait_for(
            asyncio.to_thread(gemini.ask, SYSTEM_PROMPT, USER_PROMPT, img),
            timeout=SCAN_TIMEOUT_S)
        result = validate(text)
        print("scan ok in %.1fs" % (time.time() - t0))
        return result
    except asyncio.TimeoutError:
        return {"type": "scan_error", "error": "timed out after %gs" % SCAN_TIMEOUT_S}
    except Exception as e:  # surface to the Lens instead of dying
        return {"type": "scan_error", "error": str(e)[:200]}


async def scan_and_broadcast(origin):
    print("scan requested (%s)" % origin)
    result = await scan()
    print(json.dumps(result, indent=2))
    if clients:
        websockets.broadcast(clients, json.dumps(result))
    return result


async def handler(ws):
    clients.add(ws)
    print(f"Lens connected ({len(clients)})")
    try:
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except ValueError:
                continue
            if msg.get("type") == "scan":
                result = await scan()
                print(json.dumps(result))
                await ws.send(json.dumps(result))
                others = clients - {ws}
                if others:
                    websockets.broadcast(others, json.dumps(result))
    except websockets.ConnectionClosed:
        pass
    finally:
        clients.discard(ws)


# ---------------------------------------------------------------- keyboard (S to scan)

def _key_reader(loop, queue):
    """Reads single key presses from the bridge window and queues them."""
    if sys.platform == "win32":
        import msvcrt
        while True:
            ch = msvcrt.getwch()
            loop.call_soon_threadsafe(queue.put_nowait, ch.lower())
    else:
        if not sys.stdin.isatty():
            return
        import termios, tty
        fd = sys.stdin.fileno()
        old = termios.tcgetattr(fd)
        try:
            tty.setcbreak(fd)
            while True:
                ch = sys.stdin.read(1)
                if not ch:
                    return
                loop.call_soon_threadsafe(queue.put_nowait, ch.lower())
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old)


async def keyboard_loop():
    queue = asyncio.Queue()
    loop = asyncio.get_running_loop()
    threading.Thread(target=_key_reader, args=(loop, queue), daemon=True).start()
    while True:
        ch = await queue.get()
        if ch == "s":
            await scan_and_broadcast("S key")
        elif ch == "q":
            print("bye")
            os._exit(0)


# ---------------------------------------------------------------- main

async def main(args):
    global source
    if args.image:
        source = ImageSource(args.image)
        label = "image %s" % args.image
    else:
        source = Grabber()
        label = "webcam %s" % os.environ.get("SCAN_CAM", "0")
    if not source.opened():
        print("Could not open %s (check camera privacy settings, or set SCAN_CAM)." % label)
        sys.exit(1)
    source.start()
    if not gemini.has_key():
        print("WARNING: GEMINI_API_KEY not set; scans will return scan_error.")

    if args.once:
        result = await scan()
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["type"] == "scan_result" else 1)

    async with websockets.serve(handler, HOST, PORT, max_size=None):
        print(f"Scan bridge on ws://{HOST}:{PORT}  (model {gemini.GEMINI_MODEL}, source {label})")
        print("Press S to scan and print the JSON, Q to quit.")
        await keyboard_loop()


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Honest Label scan bridge")
    p.add_argument("--image", help="scan this saved photo instead of the webcam")
    p.add_argument("--once", action="store_true", help="scan once, print the JSON and exit")
    asyncio.run(main(p.parse_args()))
