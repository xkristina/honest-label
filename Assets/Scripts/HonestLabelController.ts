import { CachedScanner, ScanResult } from "./ProductData"
import { COLORS, SceneKit } from "./SceneKit"

/**
 * Honest Label main controller.
 * Layout: everything sits on a virtual table whose top centre is TABLE_POS
 * (camera starts at the origin looking down -Z), so content is ~1 m away and
 * below eye level.
 */
const TABLE_POS = new vec3(0, -30, -100)

@component
export class HonestLabelController extends BaseScriptComponent {
  @input boxMesh: RenderMesh
  @input unlitMaterial: Material

  private kit: SceneKit
  private scanner = new CachedScanner()
  private table: SceneObject
  private startCard: SceneObject
  private subtitle: Text
  private lastResult: ScanResult = null

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
  }

  private onStart(): void {
    if (!this.boxMesh || !this.unlitMaterial) {
      print("[HonestLabel] ERROR: boxMesh or unlitMaterial input not set")
      return
    }
    this.kit = new SceneKit(this.boxMesh, this.unlitMaterial)
    this.buildTable()
    this.buildStartCard()
    print("[HonestLabel] Ready")
  }

  private buildTable(): void {
    this.table = this.kit.group(this.sceneObject, "Table", TABLE_POS)
    this.kit.box(this.table, "TableTop", new vec3(90, 1, 45), new vec3(0, -0.5, 0), COLORS.table)
  }

  private buildStartCard(): void {
    const k = this.kit
    this.startCard = k.group(this.table, "StartCard", new vec3(0, 0, 0))
    k.text(this.startCard, "Title", "Honest Label", 3.2, new vec3(0, 20, 0), COLORS.accent)
    this.subtitle = k.text(this.startCard, "Subtitle", "Hold up a product, then pinch Scan", 1.6,
      new vec3(0, 15, 0), COLORS.textDim, 50)
    k.button(this.startCard, "ScanButton", "Scan", new vec3(18, 7, 2), new vec3(0, 6, 0), () => this.onScan())
  }

  private onScan(): void {
    const r = this.scanner.next()
    this.lastResult = r
    print(`[HonestLabel] Scan -> ${r.name} (source: ${r.source})`)
    this.subtitle.text = `Scanned: ${r.name}`
  }
}
