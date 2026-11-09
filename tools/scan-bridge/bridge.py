"""Honest Label scan bridge (preview-only dev tool).

Adapted from GHOST's webcam bridge: keeps the local WebSocket server and the
threaded webcam grabber; hand tracking, rooms and lessons were removed.

Flow:
  Lens  -> {"type": "scan"}                      over ws://127.0.0.1:8765
  bridge grabs the newest webcam frame, sends it to Gemini
  bridge -> {"type": "result", "text": "..."}    to every connected Lens
         or {"type": "error",  "error": "..."}

The prompt below is a placeholder; the real one is a feature, not setup.
Run: see README.md. Key comes from GEMINI_API_KEY in the environment only.
"""
import asyncio, json, os, sys, threading, time
import cv2
import websockets

import gemini

HOST, PORT = "127.0.0.1", 8765
SYSTEM_PROMPT = "You look at a photo of a product. Reply as JSON: {\"product\": string}."
USER_PROMPT = "What product is in this photo?"

clients = set()


class Grabber(threading.Thread):
    """Reads the webcam nonstop on its own thread and keeps only the newest frame."""
    def __init__(self):
        super().__init__(daemon=True)
        backend = cv2.CAP_DSHOW if sys.platform == "win32" else (
            cv2.CAP_AVFOUNDATION if sys.platform == "darwin" else cv2.CAP_ANY)
        self.cap = cv2.VideoCapture(int(os.environ.get("SCAN_CAM", "0")), backend)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.frame, self.lock = None, threading.Lock()

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
        ok, buf = cv2.imencode(".jpg", f, [cv2.IMWRITE_JPEG_QUALITY, quality])
        return buf.tobytes() if ok else None


grabber = None


async def scan():
    img = grabber.jpeg()
    if img is None:
        return {"type": "error", "error": "no webcam frame yet"}
    try:
        text = await asyncio.to_thread(gemini.ask, SYSTEM_PROMPT, USER_PROMPT, img)
        return {"type": "result", "text": text}
    except Exception as e:  # surface to the Lens instead of dying
        return {"type": "error", "error": str(e)}


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
                print("scan requested")
                websockets.broadcast(clients, json.dumps(await scan()))
    except websockets.ConnectionClosed:
        pass
    finally:
        clients.discard(ws)


async def main():
    global grabber
    grabber = Grabber()
    if not grabber.cap.isOpened():
        print("Could not open webcam (check camera privacy settings, or set SCAN_CAM).")
        sys.exit(1)
    grabber.start()
    if not gemini.has_key():
        print("WARNING: GEMINI_API_KEY not set; scans will return an error.")
    async with websockets.serve(handler, HOST, PORT, max_size=None):
        print(f"Scan bridge on ws://{HOST}:{PORT}  (model {gemini.GEMINI_MODEL})")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
