---
status: approved
---

# Design brief: Honest Label

## The one spatial moment
I hold up a packaged food or drink, pinch Scan, and its sugar drops onto the table in front of me as a real-size stack of sugar cubes (1 cube = 4 g), with a one-line verdict beside it and 2 marketing claims decoded below. I scan a second product, both stacks stand side by side, and the better pick lights up.

## Why it belongs on glasses
- Uses: shares your view (it reads the product you're holding), draws in the world (sugar at real size on the table), leaves your body free (both hands stay on the product).
- Better than a phone: the sugar appears at real size in your world, not as a number on a screen, and you don't put the product down to use it. For shoppers, parents and anyone cutting sugar, in Jamaica and anywhere: front-of-pack marketing hides what's inside, and nobody reads nutrition panels in the aisle.

## Product or overlay
- Type: overlay. It responds to a real product.
- What the real version would sense: the product label, through the Camera Module + Remote Service Gateway on SPECS (future work).
- Stand-in for the preview: the Camera Module returns no cameras in preview, so Scan sends `{"type":"scan"}` to the local scan-bridge (`tools/scan-bridge`, ws://127.0.0.1:8765), which grabs a webcam frame, asks Gemini and returns JSON. If the bridge is down or takes over 4 s, the Lens uses cached results for the 3 demo products below, in order 1 → 2 → 3, then repeating (default).

**Message contract (bridge → Lens), fixed:**
`{"type":"scan_result","source":"live|cached","name":"Cola (330 ml can)","sugar_g":35,"serving":"per can","claims":[{"claim":"…","truth":"…"}],"verdict":"…","confidence":"label|estimate"}`
Cubes = round(sugar_g / 4). If sugar isn't readable: `sugar_g = null`, show "Not on label", never guess.

**Cached demo products (placeholders, generic names; real label numbers come later):**

| # | Name | sugar_g | Cubes | Claims → truth | Verdict |
|---|---|---|---|---|---|
| 1 | Cola (330 ml can) | 35, per can | 9 | "Natural flavours" → flavour made from natural sources in a lab, not fruit. "Classic taste" → marketing words, no nutritional meaning. | About 9 cubes of sugar, more than a child's whole daily limit. |
| 2 | Fruit juice box (200 ml) | 20, per box | 5 | "No added sugar" → no sugar added, but fruit sugar is still sugar. "Made with real fruit" → can be mostly concentrate. | 5 cubes of sugar. Healthier-sounding, still a sweet drink. |
| 3 | Bakery coco bread (wrapped) | null | "Not on label" | "Fresh baked" → says when, not what's in it. "Homestyle" → no defined meaning. | No nutrition label: Honest Label can't tell you, and won't guess. |

## Where things live
- The user looks down at the product in their hands and the table in front of them, below eye level.
- Table: a virtual table for the preview, 75 cm high, 1.0 m in front of the user (default).
- Sugar stack: on the table, 0.8–1.2 m away. Real-size cubes, about 1.6 cm each (default). Stack 1 is centred; in Compare, stack 2 sits 30 cm to its right (default).
- Verdict card: beside its stack, light text, no dark panel. Product name and grams on top (default).
- Claims: below the verdict, 2 lines each, "claim → truth".
- Start card: on the table at the same spot, with the Scan button.

## Hands and input
- Scan: pinch a big button (at least 8 cm, default) on the start card.
- Compare: pinch a big button after the first result, then Scan product 2.
- Reset: pinch a big button. It returns to the start card.
- Targets are big and highlight when aimed at. No voice.

## When things show
- Start card: shows at launch and after Reset; hides on Scan.
- "Scanning…" text: shows while waiting, up to 4 s before cached fallback (default wording).
- Cubes: drop one by one into the stack (about 0.1 s apart, default). Then the verdict card shows beside it, with the claims below.
- Compare: stack 2 appears beside stack 1. The lower-sugar stack glows and gets a "Better pick" label. If either product's sugar is null, nothing glows and the label reads "Can't compare: no sugar label" (default). If they're equal, nothing glows and the label reads "Same sugar" (default).
- Everything stays in front of the user; nothing needs an out-of-view hint.

## Done criteria
Each one can be checked in Lens Studio's preview and has a LEAF test.
1. With the bridge off, Scan shows a cached result in under 1 s.
2. The stack shows the correct cube count (Cola 9, juice 5).
3. Null sugar (coco bread) shows "Not on label" and no cubes.
4. Compare shows two stacks and highlights the lower-sugar one with "Better pick".
5. Reset returns to the start card with no stacks left.
6. No Logger errors during the full flow.

## Out of scope
- Price per gram, barcode scanning, accounts, more than 2 products.
- On-device camera recognition (SPECS Camera Module + Remote Service Gateway: future work).

## Risks and open questions
- Live scanning depends on the preview-only webcam bridge and Gemini. The accuracy of real label reading is "feel unproven". Cached results carry the demo.
- The demo numbers are placeholders until the real labels are checked.
- Cube size and table placement need checking against real-glasses comfort.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
