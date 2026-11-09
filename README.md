# Honest Label

A SPECS Lens that looks at a product's packaging and tells you what the label isn't saying.

Hold up a packaged food or drink and Honest Label shows its sugar as a real-size pile of sugar cubes on the table in front of you (1 cube = 4 g), decodes 2 marketing claims in plain words, and gives a one-line verdict. Scan a second product and both piles stand side by side; the lower-sugar one lights up as the better pick.

Built for the Devpost **Learn AR with SPECS** hackathon. Design brief: [`devpost/design-brief.md`](devpost/design-brief.md).

## Features

- **Scan:** pinch Scan to read the product in your hands. The Lens asks the scan bridge (below) for a live read of the label; if the bridge is off or slow, it uses a saved result instead. A small tag under the count says which: **live** or **saved**.
- **Real-size sugar pile:** white 1.6 cm cubes drop one by one into a pile 3 cubes wide, each with a soft glow and a small bounce as it lands. A live count ("9 cubes · 35 g") pops as it ticks up, with a "real size" tag. Cubes = round(sugar_g / 4).
- **Product picture:** a floating 14 cm picture of the product above the pile (generic illustrations, no brands). Live scans of other products show no picture.
- **Claims decoded:** a verdict card beside the pile and 2 front-of-pack claims translated into plain words.
- **Never guesses:** if sugar isn't on the label, it shows "Not on label" and no cubes, for saved and live results alike.
- **Compare:** pinch Compare, scan a second product; the second pile lands 30 cm to the right, the lower-sugar pile glows green with a short celebratory pulse and "Better pick", the other dims. If either product has no sugar label it says "Can't compare: no sugar label"; equal sugar says "Same sugar".
- **Reset:** back to the start card.
- **Made for glasses:** light text only, no dark panels (the display is additive), big pinch targets, content about 1 m away and below eye level.

## How to run

1. Install **Lens Studio 5.22 or newer** with SPECS support.
2. Clone this repo and open `honest-label.esproj` in Lens Studio.
3. In the Preview panel choose **Interactive Preview** (SPECS device). A mouse click acts as a pinch; WASD moves, Q/E go down/up, right-drag looks around.
4. Press **Scan**, then **Compare** and **Scan** again, then **Reset**.

Without the scan bridge running, every scan uses a saved result. The 3 demo products (cola can, juice box, wrapped coco bread) come in order 1 → 2 → 3, then repeat; Reset restarts the order.

### Scan bridge (live scans in the preview)

`tools/scan-bridge` is a small Python tool that grabs a webcam frame, asks Gemini what the product's label says, and answers the Lens over a local WebSocket (`ws://127.0.0.1:8765`) with a `scan_result` message (the format is in the design brief). The bridge gives Gemini 8 s (a scan usually takes 4–6 s); the Lens waits up to 10 s for the bridge, then falls back to a saved result.

**One-time setup in Lens Studio:** the bridge uses a plain `ws://` address, which Lens Studio only allows with **Experimental API** turned on. Open **Project Settings**, find **Experimental API** under General, tick it, and press Reset in the Preview. Without it, the Lens logs "URL is not secure" and quietly uses saved results. (Snap won't publish a Lens with Experimental API on, which doesn't matter for the preview demo.)

**Windows (PowerShell, from the repo root):**

```powershell
Copy-Item tools\scan-bridge\credentials.env.example tools\scan-bridge\credentials.env
notepad tools\scan-bridge\credentials.env        # set GEMINI_API_KEY=your-key and save
powershell -ExecutionPolicy Bypass -File tools\scan-bridge\run.ps1
```

**macOS / Linux:**

```bash
cp tools/scan-bridge/credentials.env.example tools/scan-bridge/credentials.env   # add GEMINI_API_KEY
bash tools/scan-bridge/run.sh
```

The first run creates a Python virtual environment with `opencv-python` and `websockets` (about a minute). The window then shows `Scan bridge on ws://127.0.0.1:8765`. Press **S** to test a scan from the bridge window and **Q** to quit. Add `--image path\to\photo.png` to scan a saved picture instead of the webcam (the generic product pictures in `Assets/Images` work for this), or `--once` to scan once and exit. `python tools/scan-bridge/test_client.py` checks the bridge without Lens Studio.

Never commit `credentials.env`; it is gitignored, and the bridge reads the key from the environment only.

## Preview note

The SPECS Camera Module returns no cameras in Lens Studio's preview, so the Lens can't see a real product there. The scan bridge is the preview stand-in: it supplies a real webcam frame and Gemini's reading of the label (tagged **live**). When the bridge is off, slow, or returns an error, the Lens uses saved results for the 3 generic demo products (tagged **saved**), so the demo never stalls. On SPECS hardware the same flow would use the Camera Module and Snap's Remote Service Gateway; that is future work.

## Project layout

```
Assets/Scripts/
  ProductData.ts            scan_result contract, cube maths, saved demo products, compare rule
  HonestLabelController.ts  states (start → result → waiting → compared), buttons, layout, pictures
  ScanClient.ts             WebSocket client for the bridge, 10 s timeout, saved-result fallback
  SugarStack.ts             real-size cube pile, drop + bounce animation, glow, highlight
  ResultCards.ts            verdict card and claim cards
  SceneKit.ts               runtime boxes, world-space text, picture cards, SIK pinch buttons
Assets/Images/              generic product pictures (cola, juice, bread)
tools/scan-bridge/          webcam → Gemini → Lens bridge (preview only)
devpost/                    design brief, video script, submission text
```

## Pre-existing code

`tools/scan-bridge/` was not written during this hackathon. It is adapted from the webcam bridge in our earlier project, **GHOST** (`tools/webcam-bridge`). We kept the local WebSocket server, the threaded webcam grabber, and the stdlib Gemini REST call. We removed GHOST's hand tracking, lesson planner, rooms, and course storage, and added image input, label reading and the `scan_result` format. Everything else in this repo was written for Honest Label during the hackathon.

## AI disclosure

- **Building:** we planned the Lens with the `plan-lens` skill (Devpost's learn-specs skill pack) and built it with **Claude Code** (Anthropic's Claude) using Snap's **CLAD** Lens Studio agents and tools. We made the design decisions; the AI wrote most of the code, step by step, and each step was compiled, checked in the preview and committed separately (see `git log`).
- **In the product:** the scan bridge sends a webcam frame to **Google Gemini** to read the label; the Lens shows Gemini's answer tagged "live" and never invents a sugar value (no value on the label means "Not on label"). The saved demo results were written by us.
- Third-party packages: Spectacles Interaction Kit and Spectacles UI Kit (Snap).

## Setup notes for contributors

- `Cache/`, `Workspaces/`, `credentials.env` and Python virtual environments are gitignored.
- The controller's `devActions` input is a dev-only hook for screenshots (for example `scan,compare,scan`); keep it empty.
