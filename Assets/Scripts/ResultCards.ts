import { NOT_ON_LABEL, ScanResult, cubesFor } from "./ProductData"
import { COLORS, SceneKit } from "./SceneKit"

const CARD_WIDTH_CM = 36

/**
 * Verdict card (name, sugar line, verdict) with the 2 decoded claims below it.
 * Light text only, no backing panel: the display is additive.
 * `pos` is the card's left edge on the table, at table height.
 */
export class ResultCards {
  readonly root: SceneObject
  readonly sugarText: Text

  constructor(kit: SceneKit, parent: SceneObject, name: string, leftEdge: vec3, r: ScanResult) {
    this.root = kit.group(parent, name, leftEdge.add(new vec3(CARD_WIDTH_CM / 2, 0, 0)))
    const L = HorizontalAlignment.Left
    const w = CARD_WIDTH_CM

    kit.text(this.root, "Name", r.name, 1.9, new vec3(0, 25, 0), COLORS.accent, w, L)

    const cubes = cubesFor(r.sugar_g)
    const sugarLine = r.sugar_g === null
      ? `Sugar: ${NOT_ON_LABEL}`
      : `${r.sugar_g} g sugar ${r.serving} = ${cubes} ${cubes === 1 ? "cube" : "cubes"}`
    this.sugarText = kit.text(this.root, "Sugar", sugarLine, 1.6, new vec3(0, 22, 0), COLORS.text, w, L)

    kit.text(this.root, "Verdict", r.verdict, 1.6, new vec3(0, 18, 0), COLORS.text, w, L)

    r.claims.slice(0, 2).forEach((c, i) => {
      kit.text(this.root, `Claim_${i + 1}`, `"${c.claim}"  →  ${c.truth}`, 1.25,
        new vec3(0, 12.5 - i * 4, 0), COLORS.textDim, w, L)
    })
  }

  destroy(): void {
    this.root.destroy()
  }
}
