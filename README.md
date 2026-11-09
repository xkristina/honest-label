# Honest Label

A SPECS Lens that looks at a product's packaging and tells you what the label isn't saying.

Hold up a packaged food or drink and Honest Label shows its sugar as a real-size pile of sugar cubes on the table in front of you (1 cube = 4 g), decodes 2 marketing claims in plain words, and gives a one-line verdict. Scan a second product and both piles stand side by side; the lower-sugar one lights up as the better pick.

Built for the Devpost **Learn AR with SPECS** hackathon. Design brief: [`devpost/design-brief.md`](devpost/design-brief.md).

## Features

- **Scan:** pinch Scan to read the product in your hands.
- **Real-size sugar pile:** white 1.6 cm cubes drop one by one into a pile 3 cubes wide on the table, with a live count ("9 cubes · 35 g") and a "real size" tag. Cubes = round(sugar_g / 4).
- **Claims decoded:** a verdict card beside the pile and 2 front-of-pack claims translated into plain words.
- **Never guesses:** if sugar isn't on the label, it shows "Not on label" and no cubes.
- **Compare:** pinch Compare, scan a second product; the second pile lands 30 cm to the right, the lower-sugar pile glows green with "Better pick", the other dims. If either product has no sugar label it says "Can't compare: no sugar label"; equal sugar says "Same sugar".
- **Reset:** back to the start card.
- **Made for glasses:** light text only, no dark panels (the display is additive), big pinch targets, content about 1 m away and below eye level.

## How to run

1. Install **Lens Studio 5.22 or newer** with SPECS support.
2. Clone this repo and open `honest-label.esproj` in Lens Studio.
3. In the Preview panel choose **Interactive Preview** (SPECS device). A mouse click acts as a pinch; WASD moves, Q/E go down/up, right-drag looks around.
4. Press **Scan**, then **Compare** and **Scan** again, then **Reset**.

The 3 demo products (cola can, juice box, wrapped coco bread) are served from cached results in order 1 → 2 → 3, then repeat. Reset restarts the order.

### Scan bridge (optional, preview only)

`tools/scan-bridge` is a small Python tool that grabs a webcam frame, asks Gemini what the product's label says, and sends the result to the Lens over a local WebSocket (`ws://127.0.0.1:8765`) using the `scan_result` message format in the design brief.

```bash
cp tools/scan-bridge/credentials.env.example tools/scan-bridge/credentials.env   # add GEMINI_API_KEY
set -a; source tools/scan-bridge/credentials.env; set +a
bash tools/scan-bridge/run.sh            # first run creates a venv with opencv-python + websockets
python tools/scan-bridge/test_client.py  # checks the bridge without Lens Studio
```

**Status:** the bridge runs on its own, but the Lens is not yet connected to it. The Lens currently always uses the cached results. Never commit `credentials.env`.

## Preview note

The SPECS Camera Module returns no cameras in Lens Studio's preview, so the Lens can't see a real product there. In preview, scanning is a stand-in: the Lens uses cached results for the 3 demo products, and the scan bridge (above) is the planned route for live webcam scans, with cached results as the fallback when the bridge is down or takes longer than 4 s. On SPECS hardware the same flow would use the Camera Module and Snap's Remote Service Gateway; that is future work.

The demo sugar values are placeholders until checked against real labels.

## Project layout

```
Assets/Scripts/
  ProductData.ts            scan_result contract, cube maths, cached demo products, compare rule
  HonestLabelController.ts  states (start → result → waiting → compared), buttons, layout
  SugarStack.ts             real-size cube pile, drop animation, highlight
  ResultCards.ts            verdict card and claim cards
  SceneKit.ts               runtime boxes, world-space text, SIK pinch buttons
tools/scan-bridge/          webcam → Gemini → Lens bridge (preview only)
devpost/                    design brief, video script, submission text
```

## Pre-existing code

`tools/scan-bridge/` was not written during this hackathon. It is adapted from the webcam bridge in our earlier project, **GHOST** (`tools/webcam-bridge`). We kept the local WebSocket server, the threaded webcam grabber, and the stdlib Gemini REST call. We removed GHOST's hand tracking, lesson planner, rooms, and course storage, and added image input to the Gemini call. Everything else in this repo was written for Honest Label during the hackathon.

## AI disclosure

- **Building:** we planned the Lens with the `plan-lens` skill (Devpost's learn-specs skill pack) and built it with **Claude Code** (Anthropic's Claude) using Snap's **CLAD** Lens Studio agents and tools. We made the design decisions; the AI wrote most of the code, step by step, and each step was compiled, checked in the preview and committed separately (see `git log`).
- **In the product:** the optional scan bridge sends a webcam frame to **Google Gemini** to read the label. The Lens itself makes no AI calls; the demo results are cached and were written by us.
- Third-party packages: Spectacles Interaction Kit and Spectacles UI Kit (Snap).

## Setup notes for contributors

- `Cache/`, `Workspaces/`, `credentials.env` and Python virtual environments are gitignored.
- The controller's `devActions` input is a dev-only hook for screenshots (for example `scan,compare,scan`); keep it empty.
