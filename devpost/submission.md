# Devpost submission: Honest Label

## Before you press Submit

- [ ] Make the repo public: https://github.com/xkristina/honest-label (Settings → Danger zone → Change visibility).
- [ ] Record the video from `devpost/video-script.md`, under 3 minutes, upload to YouTube as Public or Unlisted, paste the link below and in the Devpost "Video" field.
- [ ] Upload the gallery images from `devpost/screenshots/` (01-start, 02-scan-cola-live, 03-compare, 04-cant-compare). Devpost shows the first one as the thumbnail; use 02.
- [ ] Project name: **Honest Label**. Tagline (below) is under 60 characters.
- [ ] "Built with" tags and the "Try it out" links are at the bottom.
- [ ] Paste the sections below into "About the project" (Devpost renders Markdown headings).

---

**Project name:** Honest Label

**Tagline:** See the sugar behind the marketing, real-size, on your table.

## Inspiration
The front of a pack is marketing: "natural flavours", "no added sugar", "made with real fruit". The truth sits in a tiny nutrition panel on the back, and almost nobody reads it in the aisle, especially with a child pulling at your sleeve. We wanted something for shoppers, parents and anyone trying to cut sugar, in Jamaica and anywhere, that turns a label into something you can *see*.

## What it does
Hold up a packaged food or drink and pinch **Scan**. Honest Label reads the label and drops the product's sugar onto the table in front of you as a real-size pile of sugar cubes (1 cube = 4 g), one cube at a time, with a picture of the product floating above it. Beside the pile is a one-line verdict, and below it two front-of-pack claims decoded in plain words: "Natural flavours" becomes "flavour made from natural sources in a lab, not fruit."

Pinch **Compare** and scan a second product: both piles stand side by side, the lower-sugar one glows green and gets a **Better pick** label. If a product has no nutrition label, like a wrapped bakery coco bread, Honest Label shows "Not on label" and refuses to guess or pick a winner. Every result carries a small tag: **live** when it was just read from the packaging, **saved** when it came from the built-in demo set.

## Why glasses
Your hands stay on the product and your eyes stay on the shelf. A phone can show you "35 g"; glasses can put nine sugar cubes on the table next to the can. Real size in your world is the whole point.

## How we built it
- **Design first.** We used the `plan-lens` skill to write a one-page design brief (`devpost/design-brief.md`): one spatial moment, where things live (about 1 m away, below eye level, on the table), big pinch targets, light text only for the additive display, and six done criteria.
- **Built with Claude Code and Snap's CLAD.** We built the Lens in small steps (saved data, start card, cube pile, cards, compare and reset, bridge connection, pictures and polish), and after each step compiled, checked the Lens Studio preview and committed. TypeScript with Spectacles Interaction Kit for every pinch.
- **A fixed message contract** (`scan_result` JSON) between the scanner and the Lens, so scanning and the AR view could be built in parallel.
- **Live scans in the preview.** The SPECS Camera Module returns no cameras in Lens Studio's preview, so we wrote a scan bridge: a small Python tool (adapted from our earlier project GHOST) that grabs a webcam frame, asks Gemini to read the label, and answers the Lens over a local WebSocket. We tested it end to end: a back-of-can nutrition panel came back as 35 g in about 5 s and the Lens dropped nine cubes tagged **live**. If the bridge is off, slow (over 10 s) or errors, the Lens falls back to saved results for three generic demo products, tagged **saved**, so the demo never stalls.

## Challenges we ran into
- **No camera in the preview.** We designed the bridge-plus-fallback up front instead of finding out at the end.
- **Plain `ws://` is locked down.** Lens Studio only opens an insecure local WebSocket with Experimental API switched on; the Lens detects the refusal and falls back to saved results instead of failing.
- **Gemini sits right on our first timeout.** Our first bridge cap was 4 s and label reads took 4–6 s, so every live scan quietly fell back to "saved". Measuring the real latency and raising the caps (bridge 8 s, Lens 10 s) fixed it.
- **Real size is small.** A 1.6 cm cube at 1 m is easy to miss, so instead of scaling it up we piled the cubes 3 wide in layers, gave each a soft glow, and added a product picture above the pile so it reads as "a pile of sugar next to the can" while staying true to size.
- **Layout in a narrow view.** Our first button row hid the piles behind it; we moved the buttons to hang off the table's front edge and raised the table so everything fits where you're already looking.
- A preview-inspection package that our tooling auto-installed broke the TypeScript build; we removed it and switched to plain preview screenshots.

## Accomplishments that we're proud of
- The moment the cubes drop onto the table: it makes 35 g feel like something.
- Honest about uncertainty: no label means no guess, for live and saved results alike.
- Live label reading in the preview, proven end to end, with a fallback that keeps the demo moving.
- Every build step is its own commit, checked in the preview.

## What we learned
- Designing for an additive display: light text, no dark panels, nothing important at the edges.
- Real-world scale is a design decision, not a default.
- Measure before you set a timeout.
- Writing the design brief first made the AI-assisted build faster and more predictable.

## What's next for Honest Label
- On SPECS hardware: Camera Module + Remote Service Gateway for on-device label reading, replacing the preview bridge.
- More decoded claims, and a per-serving vs per-pack toggle.
- Pictures for live-scanned products, not just the three demo ones.

## Built with
Lens Studio · SPECS · TypeScript · Spectacles Interaction Kit · Claude Code · CLAD · Python · OpenCV · WebSockets · Gemini API

## Pre-existing code and AI disclosure
`tools/scan-bridge` is adapted from the webcam bridge in our earlier project GHOST; everything else was written during the hackathon. The Lens was planned with the `plan-lens` skill and built with Claude Code (Anthropic) and Snap's CLAD agents; the bridge uses Google Gemini to read labels. Details in the README.

## Try it out
- Repo: https://github.com/xkristina/honest-label
- Video: _TODO: YouTube link_
