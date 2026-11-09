import { cubesFor, NOT_ON_LABEL, ScanResult } from "./ProductData"
import { COLORS, SceneKit } from "./SceneKit"

/** Real sugar cube edge length, cm. */
export const CUBE_CM = 1.6
const GAP_CM = 0.15
const DROP_HEIGHT_CM = 25
const DROP_TIME_S = 0.3
const CUBE_INTERVAL_S = 0.12

interface Falling {
  obj: SceneObject
  restY: number
  startAt: number
}

/**
 * A column of real-size sugar cubes standing on the table at `base`.
 * Cubes drop in one at a time; the count label sits on top.
 */
export class SugarStack {
  readonly root: SceneObject
  readonly cubeCount: number | null
  private cubes: SceneObject[] = []
  private falling: Falling[] = []
  private label: Text
  private elapsed = 0
  private landed = 0

  constructor(private kit: SceneKit, parent: SceneObject, name: string, base: vec3, readonly result: ScanResult) {
    this.root = kit.group(parent, name, base)
    this.cubeCount = cubesFor(result.sugar_g)
    const n = this.cubeCount ?? 0
    const step = CUBE_CM + GAP_CM

    for (let i = 0; i < n; i++) {
      const restY = CUBE_CM / 2 + i * step
      const cube = kit.box(this.root, `Cube_${i + 1}`, new vec3(CUBE_CM, CUBE_CM, CUBE_CM),
        new vec3(0, restY + DROP_HEIGHT_CM, 0), COLORS.cube)
      cube.enabled = false
      this.cubes.push(cube)
      this.falling.push({ obj: cube, restY, startAt: i * CUBE_INTERVAL_S })
    }

    const topY = n * step + 2.5
    this.label = kit.text(this.root, "CountLabel", this.cubeCount === null ? NOT_ON_LABEL : "", 1.6,
      new vec3(0, Math.max(topY, 3), 0), COLORS.text)
  }

  get isDone(): boolean {
    return this.landed >= this.cubes.length
  }

  /** Advance the drop animation. Call every frame. */
  update(dt: number): void {
    if (this.isDone) return
    this.elapsed += dt
    for (const f of this.falling) {
      const t = (this.elapsed - f.startAt) / DROP_TIME_S
      if (t < 0) continue
      f.obj.enabled = true
      const k = Math.min(1, t)
      const y = f.restY + DROP_HEIGHT_CM * (1 - k * k) // ease-in, like falling
      f.obj.getTransform().setLocalPosition(new vec3(0, y, 0))
    }
    this.landed = this.falling.filter((f) => this.elapsed - f.startAt >= DROP_TIME_S).length
    this.updateLabel()
  }

  private updateLabel(): void {
    if (this.cubeCount === null) return
    const g = this.result.sugar_g
    this.label.text = `${this.landed} ${this.landed === 1 ? "cube" : "cubes"} · ${g} g`
  }

  /** Show every cube at rest immediately (used when skipping animation). */
  finish(): void {
    this.elapsed = 1e6
    this.update(0)
  }

  destroy(): void {
    this.root.destroy()
  }
}
