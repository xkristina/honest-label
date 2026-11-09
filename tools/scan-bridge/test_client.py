"""Acts like the Lens: asks for one scan and prints the reply. Checks the bridge without Lens Studio."""
import asyncio, json, websockets


async def main():
    async with websockets.connect("ws://127.0.0.1:8765") as ws:
        await ws.send(json.dumps({"type": "scan"}))
        print(await ws.recv())

asyncio.run(main())
