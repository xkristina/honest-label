# Honest Label: demo video script

**Length:** 2:40 (limit 3:00, target under 2:45).
**Recording:** Lens Studio Interactive Preview, full frame, plus a small webcam inset (bottom-right) of you holding each product.
**Before recording:** in the Preview press Reset. Turn every product's brand logo away from the webcam or cover it with tape: no brand names on screen or in the voiceover. Have a generic cola can, a juice box and a wrapped coco bread within reach.
**Click = pinch** in Interactive Preview.

| # | Time | On screen | What you click / do | Voiceover |
|---|---|---|---|---|
| 1 | 0:00–0:10 | Webcam inset large: you in a shop aisle or kitchen, turning a cola can to its colourful front. | Hold the can up to the webcam. | "The front of a pack is marketing. The truth is in a tiny panel on the back that nobody reads in the aisle." |
| 2 | 0:10–0:20 | Same, then cut to the Preview: start card "Honest Label" on the table. | Nothing. | "Honest Label is for shoppers, parents, anyone trying to cut sugar, here in Jamaica and anywhere." |
| 3 | 0:20–0:30 | Preview: start card, Scan button. Webcam inset shrinks to the corner, can in your hands. | Hover the Scan button so it lights up. | "Hold up a product with both hands, and pinch Scan." |
| 4 | 0:30–0:55 | **Hero shot.** "Scanning . . ." for a moment, then 9 glowing white cubes drop and bounce one by one into a pile on the table; the count pops up to "9 cubes · 35 g", tagged "real size · live" (or "saved" with the bridge off). A picture of the can floats above the pile. | Click **Scan**. Then slowly move closer (W) and look down at the pile (right-drag). | "That's the sugar in one can of cola. Real size, right on the table in front of you: nine cubes. Not a number on a phone. A pile you can see." |
| 5 | 0:55–1:15 | Verdict card: "About 9 cubes of sugar, more than a child's whole daily limit." Claims: "Natural flavours" → …, "Classic taste" → … | Look across to the card (right-drag); hold still on the claims. | "Then it decodes the label. 'Natural flavours' means flavour made from natural sources in a lab, not fruit. 'Classic taste' has no nutritional meaning at all." |
| 6 | 1:15–1:45 | Compare: second pile lands 30 cm to the right with the juice box picture above it; the juice pile glows green with a quick pulse and "Better pick"; the cola pile and picture dim; "Fruit juice box (200 ml): 15 g less sugar" at the top. | Click **Compare**. Swap to the juice box in the webcam inset. Click **Scan**. | "Not sure which to buy? Pinch Compare, scan the other one, and both piles stand side by side. The lower-sugar one lights up. But five cubes is still five cubes: 'no added sugar' doesn't mean no sugar." |
| 7 | 1:45–2:05 | Coco bread replaces the juice box: its wrapped-loaf picture above an empty spot, "Not on label", "Can't compare: no sugar label", nothing glows. | Click **Compare**. Hold up the wrapped coco bread. Click **Scan**. | "This coco bread has no nutrition label. Honest Label won't guess. It tells you it can't know, and it doesn't pick a winner." |
| 8 | 2:05–2:25 | Back to the cola pile: Reset, Scan. Slow walk around the pile (A/D). | Click **Reset**, then **Scan**. Strafe around the pile. | "Why glasses? Your hands stay on the product, your eyes stay on the shelf, and the sugar shows up in your world at real size, where a phone can only show you a number." |
| 9 | 2:25–2:40 | Quick cuts: devpost/design-brief.md, the Claude Code terminal, `git log --oneline`. | Screen recording of the files. | "We planned it as a design brief, built it step by step with Claude Code and Snap's CLAD agents, and committed every step. Scans go through our webcam bridge and Gemini, tagged 'live'; if the bridge is off or slow, the Lens falls back to saved results, tagged 'saved', so the demo never stalls." |
| — | 2:40 | End card: "Honest Label: the truth behind the label." Repo URL. | — | (silence) |

## Notes
- **Live or saved?** For a clean recording, run the Lens without the bridge: every scan then uses the saved results instantly and the tag reads "saved", which shot 9's voiceover covers. To show live scans instead, start `tools\scan-bridge\run.ps1` with a Gemini key and Experimental API on, hold the real product's nutrition panel to the webcam (the front of a pack gives "Not on label"), and allow 4–6 s per scan; the tag then reads "live" and Gemini's own wording appears on the cards.
- Sugar numbers in shots 4 and 6 are the saved demo values (35 g = 9 cubes, 20 g = 5 cubes). Cube count is round(grams / 4).
- Before recording, press Reset in the Preview so the saved order starts at the cola.
