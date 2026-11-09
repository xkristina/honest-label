import { cubesFor, NOT_ON_LABEL, ScanResult } from "./ProductData"
import { COLORS, SceneKit } from "./SceneKit"

/** Real sugar cube edge length, cm. */
export const CUBE_CM = 1.6
const GAP_CM = 0.15
const STEP_CM = CUBE_CM + GAP_CM
/** Cubes per row; rows stack upward in layers. */
const PILE_WIDTH = 3
const DROP_HEIGHT_CM = 25
const DROP_TIME_S = 0.3
const CUBE_INTERVAL_S = 0.12

export type Highlight = "none" | "better" | "dim"

interface Falling {
  obj: SceneObject
  rest: vec3
  startAt: number
}

/**
 * A neat pile of real-size sugar cubes on the table at `base`: rows of 3,
 * layers going up. Cubes drop in one at a time; the count label and a
 * "real size" tag sit on top.
 */
export class SugarStack {
  readonly root: SceneObject
  readonly cubeCount: number | null
  /** Height of the pile's top, cm above the table. */
  readonly topY: number
  private cubes: SceneObject[] = []
  private falling: Falling[] = []
  private label: Text
  private elapsed = 0
  private landed = 0
  private highlight: Highlight = "none"
  private pulseT = 0

  constructor(private kit: SceneKit, parent: SceneObject, name: string, base: vec3, readonly result: ScanResult) {
    this.root = kit.group(parent, name, base)
    this.cubeCount = cubesFor(result.sugar_g)
    const n = this.cubeCount ?? 0

    for (let i = 0; i < n; i++) {
      const col = i % PILE_WIDTH
      const layer = Math.floor(i / PILE_WIDTH)
      const rest = new vec3((col - (PILE_WIDTH - 1) / 2) * STEP_CM, CUBE_CM / 2 + layer * STEP_CM, 0)
      const cube = kit.box(this.root, `Cube_${i + 1}`, new vec3(CUBE_CM, CUBE_CM, CUBE_CM),
        rest.add(new vec3(0, DROP_HEIGHT_CM, 0)), COLORS.cube)
      cube.enabled = false
      this.cubes.push(cube)
      this.falling.push({ obj: cube, rest, startAt: i * CUBE_INTERVAL_S })
    }

    const layers = Math.ceil(n / PILE_WIDTH)
    this.topY = layers * STEP_CM
    this.label = kit.text(this.root, "CountLabel", this.cubeCount === null ? NOT_ON_LABEL : "", 1.6,
      new vec3(0, Math.max(this.topY + 4.2, 3), 0), COLORS.text)
    // Under the count label: "real size · live" / "real size · saved" ("live"/"saved" alone if no cubes).
    const sourceTag = result.source === "live" ? "live" : "saved"
    const tag = this.cubeCount !== null ? `real size · ${sourceTag}` : sourceTag
    kit.text(this.root, "RealSizeTag", tag, 1.0, new vec3(0, this.topY + 2.2, 0), COLORS.textDim)
  }

  get isDone(): boolean {
    return this.landed >= this.cubes.length
  }

  /** Advance the drop animation and the highlight pulse. Call every frame. */
  update(dt: number): void {
    if (!this.isDone) {
      this.elapsed += dt
      for (const f of this.falling) {
        const t = (this.elapsed - f.startAt) / DROP_TIME_S
        if (t < 0) continue
        f.obj.enabled = true
        const k = Math.min(1, t)
        f.obj.getTransform().setLocalPosition(f.rest.add(new vec3(0, DROP_HEIGHT_CM * (1 - k * k), 0)))
      }
      this.landed = this.falling.filter((f) => this.elapsed - f.startAt >= DROP_TIME_S).length
      this.updateLabel()
    }
    if (this.highlight === "better") {
      this.pulseT += dt
      const s = 1 + 0.04 * Math.sin(this.pulseT * 4)
      this.root.getTransform().setLocalScale(new vec3(s, s, s))
    }
  }

  private updateLabel(): void {
    if (this.cubeCount === null) return
    this.label.text = `${this.landed} ${this.landed === 1 ? "cube" : "cubes"} · ${this.result.sugar_g} g`
  }

  setHighlight(h: Highlight): void {
    this.highlight = h
    const color = h === "better" ? COLORS.good : h === "dim" ? COLORS.dimCube : COLORS.cube
    this.cubes.forEach((c) => this.kit.setColor(c, color))
    this.label.textFill.color = h === "better" ? COLORS.good : COLORS.text
    if (h !== "better") this.root.getTransform().setLocalScale(vec3.one())
  }

  setPosition(p: vec3): void {
    this.root.getTransform().setLocalPosition(p)
  }

  destroy(): void {
    this.root.destroy()
  }
}
