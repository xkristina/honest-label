"""Acts like the Lens: asks for one scan and prints the reply. Checks the bridge without Lens Studio."""
import asyncio, json, websockets


async def main():
    async with websockets.connect("ws://127.0.0.1:8765") as ws:
        await ws.send(json.dumps({"type": "scan"}))
        reply = json.loads(await asyncio.wait_for(ws.recv(), timeout=10))
        print(json.dumps(reply, indent=2))
        assert reply.get("type") in ("scan_result", "scan_error"), "unexpected reply type"

asyncio.run(main())
