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
| 4 | 0:30–0:55 | **Hero shot.** 9 white cubes drop one by one into a pile on the table; "9 cubes · 35 g", "real size". | Click **Scan**. Then slowly move closer (W) and look down at the pile (right-drag). | "That's the sugar in one can of cola. Real size, right on the table in front of you: nine cubes. Not a number on a phone. A pile you can see." |
| 5 | 0:55–1:15 | Verdict card: "About 9 cubes of sugar, more than a child's whole daily limit." Claims: "Natural flavours" → …, "Classic taste" → … | Look across to the card (right-drag); hold still on the claims. | "Then it decodes the label. 'Natural flavours' means flavour made from natural sources in a lab, not fruit. 'Classic taste' has no nutritional meaning at all." |
| 6 | 1:15–1:45 | Compare: second pile lands 30 cm to the right; juice box pile glows green, "Better pick"; cola dims; "Fruit juice box (200 ml): 15 g less sugar". | Click **Compare**. Swap to the juice box in the webcam inset. Click **Scan**. | "Not sure which to buy? Pinch Compare, scan the other one, and both piles stand side by side. The lower-sugar one lights up. But five cubes is still five cubes: 'no added sugar' doesn't mean no sugar." |
| 7 | 1:45–2:05 | Coco bread replaces the juice box: no cubes, "Not on label", "Can't compare: no sugar label", nothing glows. | Click **Compare**. Hold up the wrapped coco bread. Click **Scan**. | "This coco bread has no nutrition label. Honest Label won't guess. It tells you it can't know, and it doesn't pick a winner." |
| 8 | 2:05–2:25 | Back to the cola pile: Reset, Scan. Slow walk around the pile (A/D). | Click **Reset**, then **Scan**. Strafe around the pile. | "Why glasses? Your hands stay on the product, your eyes stay on the shelf, and the sugar shows up in your world at real size, where a phone can only show you a number." |
| 9 | 2:25–2:40 | Quick cuts: devpost/design-brief.md, the Claude Code terminal, `git log --oneline`. | Screen recording of the files. | "We planned it as a design brief, built it step by step with Claude Code and Snap's CLAD agents, and committed every step. In this preview the scan uses cached results for our demo products; live scanning goes through our webcam bridge." |
| — | 2:40 | End card: "Honest Label: the truth behind the label." Repo URL. | — | (silence) |

## Notes
- Shot 9's last line matches what the Lens does today. If the bridge connection (Step F) is finished and working before recording, change it to: "Live scanning goes through a webcam bridge and Gemini; if it's slow, it falls back to cached results."
- Sugar numbers are placeholders until checked against the real labels; update the voiceover in shots 4 and 6 if they change.
- Cube count is round(grams / 4): 35 g = 9 cubes, 20 g = 5 cubes.
