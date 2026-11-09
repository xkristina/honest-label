import { CachedScanner, ScanResult } from "./ProductData"
import { COLORS, SceneKit } from "./SceneKit"
import { SugarStack } from "./SugarStack"

/**
 * Honest Label main controller.
 * Layout: everything sits on a virtual table whose top centre is TABLE_POS
 * (camera starts at the origin looking down -Z), so content is ~1 m away and
 * below eye level.
 */
const TABLE_POS = new vec3(0, -24, -100)
/** Stack 1 base on the table (table-local). Stack 2 sits 30 cm to its right (Step E). */
const STACK1_POS = new vec3(-18, 0, 0)

@component
export class HonestLabelController extends BaseScriptComponent {
  @input boxMesh: RenderMesh
  @input unlitMaterial: Material
  /** Dev only: run N scans at start so screenshots show results without clicking. Keep 0 for the real Lens. */
  @input autoScanCount: number = 0

  private kit: SceneKit
  private scanner = new CachedScanner()
  private table: SceneObject
  private startCard: SceneObject
  private actionRow: SceneObject
  private stack1: SugarStack = null
  private lastResult: ScanResult = null

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private onStart(): void {
    if (!this.boxMesh || !this.unlitMaterial) {
      print("[HonestLabel] ERROR: boxMesh or unlitMaterial input not set")
      return
    }
    this.kit = new SceneKit(this.boxMesh, this.unlitMaterial)
    this.buildTable()
    this.buildStartCard()
    this.buildActionRow()
    print("[HonestLabel] Ready")
    for (let i = 0; i < this.autoScanCount; i++) this.onScan()
  }

  private onUpdate(): void {
    if (this.stack1) this.stack1.update(getDeltaTime())
  }

  private buildTable(): void {
    this.table = this.kit.group(this.sceneObject, "Table", TABLE_POS)
    this.kit.box(this.table, "TableTop", new vec3(90, 1, 45), new vec3(0, -0.5, 0), COLORS.table)
  }

  private buildStartCard(): void {
    const k = this.kit
    this.startCard = k.group(this.table, "StartCard", new vec3(0, 0, 0))
    k.text(this.startCard, "Title", "Honest Label", 3.2, new vec3(0, 20, 0), COLORS.accent)
    k.text(this.startCard, "Subtitle", "Hold up a product, then pinch Scan", 1.6,
      new vec3(0, 15, 0), COLORS.textDim, 50)
  }

  /** Buttons along the front edge of the table. */
  private buildActionRow(): void {
    this.actionRow = this.kit.group(this.table, "ActionRow", new vec3(0, 4, 12))
    this.kit.button(this.actionRow, "ScanButton", "Scan", new vec3(18, 7, 2), new vec3(0, 0, 0), () => this.onScan())
  }

  private onScan(): void {
    const r = this.scanner.next()
    this.lastResult = r
    print(`[HonestLabel] Scan -> ${r.name} (source: ${r.source})`)
    this.startCard.enabled = false
    this.showResult(r)
  }

  private showResult(r: ScanResult): void {
    if (this.stack1) this.stack1.destroy()
    this.stack1 = new SugarStack(this.kit, this.table, "Stack1", STACK1_POS, r)
    print(`[HonestLabel] Stack1 cubes: ${this.stack1.cubeCount === null ? "Not on label" : this.stack1.cubeCount}`)
  }
}
