# Devpost submission draft: Honest Label

> **Before submitting:** replace the placeholder sugar values if you check them against real labels, add the YouTube link and make the repo public. If the bridge connection (Step F) gets finished, update "What's next" and the "How we built it" status line.

**Tagline:** See the sugar behind the marketing: real-size, on the table in front of you.

## Inspiration
The front of a pack is marketing: "natural flavours", "no added sugar", "made with real fruit". The truth sits in a tiny nutrition panel on the back, and almost nobody reads it in the aisle, especially with a child pulling at your sleeve. We wanted something for shoppers, parents and anyone trying to cut sugar, in Jamaica and anywhere, that turns a label into something you can *see*.

## What it does
Hold up a packaged food or drink and pinch **Scan**. Honest Label drops the product's sugar onto the table in front of you as a real-size pile of sugar cubes (1 cube = 4 g), one cube at a time. Beside the pile is a one-line verdict, and below it two front-of-pack claims decoded in plain words: "Natural flavours" becomes "flavour made from natural sources in a lab, not fruit."

Pinch **Compare** and scan a second product: both piles stand side by side, the lower-sugar one glows green and gets a **Better pick** label. If a product has no nutrition label, like a wrapped bakery coco bread, Honest Label shows "Not on label" and refuses to guess or pick a winner.

## Why glasses
Your hands stay on the product and your eyes stay on the shelf. A phone can show you "35 g"; glasses can put nine sugar cubes on the table next to the can. Real size in your world is the whole point.

## How we built it
- **Design first.** We used the `plan-lens` skill to write a one-page design brief: one spatial moment, where things live (about 1 m away, below eye level, on the table), big pinch targets, light text only for the additive display, and six done criteria.
- **Built with Claude Code and Snap's CLAD.** We built the Lens in small steps (cached data, start card, cube pile, cards, compare and reset), and after each step compiled, checked the Lens Studio preview and committed. TypeScript with Spectacles Interaction Kit for every pinch.
- **A fixed message contract** (`scan_result` JSON) between the scanner and the Lens, so scanning and the AR view could be built in parallel.
- **Preview stand-in.** The SPECS Camera Module returns no cameras in Lens Studio's preview, so the demo uses cached results for three products. Our scan bridge (a Python tool adapted from our earlier project GHOST) grabs a webcam frame and asks Gemini to read the label; connecting it to the Lens is in progress.

## Challenges we ran into
- **No camera in the preview.** We designed the stand-in up front instead of finding out at the end.
- **Real size is small.** A 1.6 cm cube at 1 m is easy to miss, so instead of scaling it up we piled the cubes 3 wide in layers so it reads as "a pile of sugar" while staying true to size.
- **Layout in a narrow view.** Our first button row hid the piles behind it; we moved the buttons to hang off the table's front edge and raised the table so everything fits where you're already looking.
- A preview-inspection package that our tooling auto-installed broke the TypeScript build; we removed it and switched to plain preview screenshots.

## Accomplishments that we're proud of
- The moment the cubes drop onto the table: it makes 35 g feel like something.
- Honest about uncertainty: no label means no guess.
- Every build step is its own commit, checked in the preview.

## What we learned
- Designing for an additive display: light text, no dark panels, nothing important at the edges.
- Real-world scale is a design decision, not a default.
- Writing the design brief first made the AI-assisted build faster and more predictable.

## What's next for Honest Label
- Connect the scan bridge to the Lens (live webcam scans with a 4 s cached fallback).
- On SPECS hardware: Camera Module + Remote Service Gateway for on-device label reading.
- Check the demo values against real labels and add more products.

## Built with
Lens Studio · SPECS · TypeScript · Spectacles Interaction Kit · Claude Code · CLAD · Python · Gemini API

## Pre-existing code and AI disclosure
`tools/scan-bridge` is adapted from the webcam bridge in our earlier project GHOST; everything else was written during the hackathon. The Lens was planned with the `plan-lens` skill and built with Claude Code (Anthropic) and Snap's CLAD agents; the optional bridge uses Google Gemini to read labels. Details in the README.

## Links
- Repo: https://github.com/xkristina/honest-label
- Video: _TODO: YouTube link_
