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
const BOUNCE_TIME_S = 0.25
const BOUNCE_CM = 0.8
const CUBE_INTERVAL_S = 0.12
const LABEL_POP_S = 0.18
const HALO_SCALE = 1.35
const CELEBRATE_S = 0.6

export type Highlight = "none" | "better" | "dim"

interface Falling {
  obj: SceneObject
  rest: vec3
  startAt: number
}

/**
 * A neat pile of real-size sugar cubes on the table at `base`: rows of 3,
 * layers going up. Cubes drop in one at a time with a small bounce; each has
 * a soft glow. The count label pops as it ticks up; a "real size · live|saved"
 * tag sits under it.
 */
export class SugarStack {
  readonly root: SceneObject
  readonly cubeCount: number | null
  /** Height of the pile's top, cm above the table. */
  readonly topY: number
  private cubes: SceneObject[] = []
  private halos: SceneObject[] = []
  private falling: Falling[] = []
  private label: Text
  private labelObj: SceneObject
  private elapsed = 0
  private landed = 0
  private highlight: Highlight = "none"
  private pulseT = 0
  private popT = LABEL_POP_S
  private celebrateT = CELEBRATE_S

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
      const halo = kit.halo(cube, `Halo_${i + 1}`, new vec3(CUBE_CM, CUBE_CM, CUBE_CM), COLORS.cubeHalo)
      halo.getTransform().setLocalScale(new vec3(HALO_SCALE, HALO_SCALE, HALO_SCALE))
      cube.enabled = false
      this.cubes.push(cube)
      this.halos.push(halo)
      this.falling.push({ obj: cube, rest, startAt: i * CUBE_INTERVAL_S })
    }

    const layers = Math.ceil(n / PILE_WIDTH)
    this.topY = layers * STEP_CM
    this.label = kit.text(this.root, "CountLabel", this.cubeCount === null ? NOT_ON_LABEL : "", 1.6,
      new vec3(0, Math.max(this.topY + 4.2, 3), 0), COLORS.text)
    this.labelObj = this.label.getSceneObject()
    // Under the count label: "real size · live" / "real size · saved" ("live"/"saved" alone if no cubes).
    const sourceTag = result.source === "live" ? "live" : "saved"
    const tag = this.cubeCount !== null ? `real size · ${sourceTag}` : sourceTag
    kit.text(this.root, "RealSizeTag", tag, 1.0, new vec3(0, this.topY + 2.2, 0), COLORS.textDim)
  }

  get isDone(): boolean {
    return this.landed >= this.cubes.length
  }

  /** Advance the drop, bounce, label pop and highlight pulse. Call every frame. */
  update(dt: number): void {
    this.elapsed += dt
    let anyMoving = false
    for (const f of this.falling) {
      const t = (this.elapsed - f.startAt) / DROP_TIME_S
      if (t < 0) { anyMoving = true; continue }
      f.obj.enabled = true
      let y: number
      if (t < 1) {
        y = DROP_HEIGHT_CM * (1 - t * t) // ease-in, like falling
        anyMoving = true
      } else {
        const b = (t - 1) * DROP_TIME_S / BOUNCE_TIME_S // 0..1 during the bounce
        y = b < 1 ? BOUNCE_CM * Math.sin(Math.PI * b) * (1 - b) : 0
        if (b < 1) anyMoving = true
      }
      f.obj.getTransform().setLocalPosition(f.rest.add(new vec3(0, y, 0)))
    }
    if (anyMoving || this.landed < this.cubes.length) {
      const landed = this.falling.filter((f) => this.elapsed - f.startAt >= DROP_TIME_S).length
      if (landed !== this.landed) {
        this.landed = landed
        this.popT = 0
        this.updateLabel()
      }
    }

    // Count label pop: 1.3 -> 1 as each cube lands.
    if (this.popT < LABEL_POP_S) {
      this.popT = Math.min(LABEL_POP_S, this.popT + dt)
      const k = this.popT / LABEL_POP_S
      const s = 1 + 0.3 * (1 - k) * (1 - k)
      this.labelObj.getTransform().setLocalScale(new vec3(s, s, s))
    }

    if (this.highlight === "better") {
      this.pulseT += dt
      let s = 1 + 0.03 * Math.sin(this.pulseT * 4)
      if (this.celebrateT < CELEBRATE_S) {
        // Short celebratory pulse right after being picked.
        this.celebrateT += dt
        const c = this.celebrateT / CELEBRATE_S
        s += 0.18 * Math.sin(Math.PI * Math.min(1, c)) * (1 - c)
      }
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
    const haloColor = h === "better" ? COLORS.goodHalo : h === "dim" ? COLORS.dimHalo : COLORS.cubeHalo
    const haloScale = h === "better" ? HALO_SCALE * 1.25 : HALO_SCALE
    this.cubes.forEach((c) => this.kit.setColor(c, color))
    this.halos.forEach((hl) => {
      this.kit.setColor(hl, haloColor)
      hl.getTransform().setLocalScale(new vec3(haloScale, haloScale, haloScale))
    })
    this.label.textFill.color = h === "better" ? COLORS.good : h === "dim" ? COLORS.textDim : COLORS.text
    if (h === "better") {
      this.celebrateT = 0
      this.pulseT = 0
    } else {
      this.root.getTransform().setLocalScale(vec3.one())
    }
  }

  setPosition(p: vec3): void {
    this.root.getTransform().setLocalPosition(p)
  }

  destroy(): void {
    this.root.destroy()
  }
}
