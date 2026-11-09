import { CachedScanner, compareResults, NOT_ON_LABEL, ScanResult } from "./ProductData"
import { COLORS, SceneKit } from "./SceneKit"
import { SugarStack } from "./SugarStack"
import { ResultCards } from "./ResultCards"
import { ScanClient } from "./ScanClient"

/**
 * Honest Label main controller.
 * Layout: everything sits on a virtual table whose top centre is TABLE_POS
 * (camera starts at the origin looking down -Z), so content is ~1 m away and
 * below eye level.
 *
 * States: start -> result -> waiting (for product 2) -> compared. Reset returns to start.
 */
const TABLE_POS = new vec3(0, -13, -100)
const STACK1_POS = new vec3(-18, 0, 0)
/** Verdict card's left edge, relative to its stack. */
const CARDS_OFFSET = new vec3(9, 0, 0)
/** In compare, the two piles sit 30 cm apart. */
const COMPARE_LEFT = new vec3(-15, 0, 0)
const COMPARE_RIGHT = new vec3(15, 0, 0)
/** Low, wide buttons on the table's front edge so they never hide the piles behind them. */
const BUTTON_SIZE = new vec3(18, 5, 2)
const BUTTON_ROW_POS = new vec3(0, -2, 24)
const BUTTON_SPACING = 22
/** Product picture height, cm. */
const IMAGE_CM = 14
const SCAN_DOT_S = 0.35

export type HLState = "start" | "result" | "waiting" | "compared"

@component
export class HonestLabelController extends BaseScriptComponent {
  @input boxMesh: RenderMesh
  @input unlitMaterial: Material
  /** Dev only: comma-separated actions run at start for screenshots, e.g. "scan,compare,scan". Keep empty. */
  @input devActions: string = ""
  /** Scan bridge (tools/scan-bridge). Without it, scans use saved results. */
  @input @allowUndefined internetModule: InternetModule
  @input bridgeUrl: string = "ws://127.0.0.1:8765"
  /** Product pictures (transparent PNGs), matched to a result by name. No match = no picture. */
  @input @allowUndefined planeMesh: RenderMesh
  @input @allowUndefined imageMaterial: Material
  @input @allowUndefined colaTexture: Texture
  @input @allowUndefined juiceTexture: Texture
  @input @allowUndefined breadTexture: Texture

  state: HLState = "start"
  stack1: SugarStack = null
  stack2: SugarStack = null
  outcomeText: Text

  private kit: SceneKit
  private scanner = new CachedScanner()
  private client: ScanClient
  private table: SceneObject
  private startCard: SceneObject
  private hint: Text
  private cards1: ResultCards = null
  private image1: SceneObject = null
  private compareGroup: SceneObject = null
  private scanBtn: SceneObject
  private compareBtn: SceneObject
  private resetBtn: SceneObject
  private scanDotsT = 0

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private onStart(): void {
    if (!this.boxMesh || !this.unlitMaterial) {
      print("[HonestLabel] ERROR: boxMesh or unlitMaterial input not set")
      return
    }
    this.kit = new SceneKit(this.boxMesh, this.unlitMaterial, this.planeMesh, this.imageMaterial)
    this.client = new ScanClient(this, this.internetModule, this.bridgeUrl, () => this.scanner.next())
    this.table = this.kit.group(this.sceneObject, "Table", TABLE_POS)
    this.kit.box(this.table, "TableTop", new vec3(90, 1, 45), new vec3(0, -0.5, 0), COLORS.table)
    this.buildStartCard()
    this.hint = this.kit.text(this.table, "Hint", "", 1.6, new vec3(0, 31, 0), COLORS.accent, 60)
    this.outcomeText = this.kit.text(this.table, "Outcome", "", 1.9, new vec3(0, 35, 0), COLORS.text, 60)
    this.buildButtons()
    this.setState("start")
    print("[HonestLabel] Ready")
    this.runDevActions()
  }

  private onUpdate(): void {
    const dt = getDeltaTime()
    if (this.stack1) this.stack1.update(dt)
    if (this.stack2) this.stack2.update(dt)
    if (this.client && this.client.busy) {
      // Simple animated indicator while waiting for the bridge.
      this.scanDotsT += dt
      const n = Math.floor(this.scanDotsT / SCAN_DOT_S) % 4
      this.hint.text = "Scanning" + " .".repeat(n)
    }
  }

  private buildStartCard(): void {
    const k = this.kit
    this.startCard = k.group(this.table, "StartCard", vec3.zero())
    k.text(this.startCard, "Title", "Honest Label", 3.2, new vec3(0, 23, 0), COLORS.accent)
    k.text(this.startCard, "Tagline", "See the sugar behind the marketing", 1.6, new vec3(0, 18.5, 0), COLORS.text, 60)
    k.text(this.startCard, "Subtitle", "Hold up a product, then pinch Scan", 1.4,
      new vec3(0, 14.5, 0), COLORS.textDim, 50)
  }

  /** Big buttons along the front edge of the table; which ones show depends on state. */
  private buildButtons(): void {
    const row = this.kit.group(this.table, "ActionRow", BUTTON_ROW_POS)
    this.scanBtn = this.kit.button(row, "ScanButton", "Scan", BUTTON_SIZE, vec3.zero(), () => this.onScan())
    this.compareBtn = this.kit.button(row, "CompareButton", "Compare", BUTTON_SIZE, vec3.zero(), () => this.onCompare())
    this.resetBtn = this.kit.button(row, "ResetButton", "Reset", BUTTON_SIZE, vec3.zero(), () => this.onReset())
  }

  private layoutButtons(visible: SceneObject[]): void {
    const all = [this.scanBtn, this.compareBtn, this.resetBtn]
    all.forEach((b) => (b.enabled = visible.indexOf(b) >= 0))
    visible.forEach((b, i) => {
      const x = (i - (visible.length - 1) / 2) * BUTTON_SPACING
      b.getTransform().setLocalPosition(new vec3(x, 0, 0))
    })
  }

  private setState(s: HLState): void {
    this.state = s
    this.startCard.enabled = s === "start"
    this.hint.text = s === "waiting" ? "Hold up product 2, then pinch Scan" : ""
    if (s === "start") this.layoutButtons([this.scanBtn])
    else if (s === "result") this.layoutButtons([this.compareBtn, this.resetBtn])
    else if (s === "waiting") this.layoutButtons([this.scanBtn, this.resetBtn])
    else this.layoutButtons([this.compareBtn, this.resetBtn])
    print(`[HonestLabel] State: ${s}`)
  }

  /** Pinch Scan: ask the bridge (live), falling back to saved results. */
  onScan(): void {
    if (this.client.busy) return
    const scanFor = this.state
    this.scanDotsT = 0
    this.hint.text = "Scanning"
    this.client.request((r) => {
      if (this.state !== scanFor) return // Reset pressed while scanning
      this.applyScan(r)
    })
  }

  private applyScan(r: ScanResult): void {
    print(`[HonestLabel] Scan -> ${r.name} (source: ${r.source})`)
    if (this.state === "waiting") this.showCompare(r)
    else this.showFirst(r)
  }

  onCompare(): void {
    if (this.state !== "result" && this.state !== "compared") return
    // From "compared", Compare swaps product 2 for a new scan; product 1 stays.
    this.clearCompare()
    this.stack1.setHighlight("none")
    this.setState("waiting")
  }

  onReset(): void {
    this.client.cancel()
    this.onResetSilently()
    this.scanner.reset()
    this.setState("start")
  }

  private showFirst(r: ScanResult): void {
    this.onResetSilently()
    this.stack1 = new SugarStack(this.kit, this.table, "Stack1", STACK1_POS, r)
    this.cards1 = new ResultCards(this.kit, this.table, "Cards1", STACK1_POS.add(CARDS_OFFSET), r)
    this.image1 = this.kit.imageCard(this.table, "Image1", this.textureFor(r), IMAGE_CM,
      STACK1_POS.add(new vec3(0, this.stack1.topY + 6 + IMAGE_CM / 2, 0)))
    print(`[HonestLabel] Stack1 cubes: ${this.stack1.cubeCount === null ? NOT_ON_LABEL : this.stack1.cubeCount}`)
    this.setState("result")
  }

  private onResetSilently(): void {
    this.clearCompare()
    if (this.stack1) this.stack1.destroy()
    if (this.cards1) this.cards1.destroy()
    if (this.image1) this.image1.destroy()
    this.stack1 = null
    this.cards1 = null
    this.image1 = null
  }

  private showCompare(r: ScanResult): void {
    this.cards1.root.enabled = false
    if (this.image1) this.image1.enabled = false
    this.stack1.setPosition(COMPARE_LEFT)
    this.stack2 = new SugarStack(this.kit, this.table, "Stack2", COMPARE_RIGHT, r)
    this.compareGroup = this.kit.group(this.table, "CompareLabels", vec3.zero())
    this.nameTag(this.stack1, COMPARE_LEFT)
    this.nameTag(this.stack2, COMPARE_RIGHT)
    this.compareImage(this.stack1, COMPARE_LEFT)
    this.compareImage(this.stack2, COMPARE_RIGHT)

    const outcome = compareResults(this.stack1.result, r)
    this.outcomeText.text = outcome.message
    if (outcome.winner !== null) {
      const better = outcome.winner === 0 ? this.stack1 : this.stack2
      const worse = outcome.winner === 0 ? this.stack2 : this.stack1
      better.setHighlight("better")
      worse.setHighlight("dim")
      const pos = outcome.winner === 0 ? COMPARE_LEFT : COMPARE_RIGHT
      this.kit.text(this.compareGroup, "BetterPick", "Better pick", 2.2,
        pos.add(new vec3(0, Math.max(better.topY, 2) + 12, 0)), COLORS.good)
    }
    print(`[HonestLabel] Compare: ${outcome.message} (winner: ${outcome.winner === null ? "none" : outcome.winner + 1})`)
    this.setState("compared")
  }

  /** Product name + sugar under each pile in compare mode. */
  private nameTag(stack: SugarStack, pos: vec3): void {
    const r = stack.result
    const sugar = r.sugar_g === null ? `Sugar: ${NOT_ON_LABEL}` : `${r.sugar_g} g ${r.serving}`
    this.kit.text(this.compareGroup, "Name_" + stack.root.name, `${r.name}\n${sugar}`, 1.4,
      pos.add(new vec3(0, Math.max(stack.topY, 2) + 8, 0)), COLORS.textDim, 26)
  }

  /** Product picture above the name tag and "Better pick" line in compare mode. */
  private compareImage(stack: SugarStack, pos: vec3): void {
    this.kit.imageCard(this.compareGroup, "Image_" + stack.root.name, this.textureFor(stack.result), IMAGE_CM,
      pos.add(new vec3(0, Math.max(stack.topY, 2) + 14 + IMAGE_CM / 2, 0)))
  }

  /** Picture for a result, matched by name; live scans of other products get none. */
  private textureFor(r: ScanResult): Texture {
    const n = (r.name || "").toLowerCase()
    if (n.indexOf("cola") >= 0) return this.colaTexture || null
    if (n.indexOf("juice") >= 0) return this.juiceTexture || null
    if (n.indexOf("bread") >= 0) return this.breadTexture || null
    return null
  }

  private clearCompare(): void {
    if (this.stack2) this.stack2.destroy()
    this.stack2 = null
    if (this.compareGroup) this.compareGroup.destroy()
    this.compareGroup = null
    if (this.outcomeText) this.outcomeText.text = ""
    if (this.stack1) this.stack1.setPosition(STACK1_POS)
    if (this.cards1) this.cards1.root.enabled = true
    if (this.image1) this.image1.enabled = true
  }

  private runDevActions(): void {
    const actions = (this.devActions || "").split(",").map((a) => a.trim()).filter((a) => a.length > 0)
    for (const a of actions) {
      if (a === "scan") this.applyScan(this.scanner.next()) // dev hook stays synchronous, saved results only
      else if (a === "livescan") this.onScan() // async: goes through the bridge client
      else if (a === "compare") this.onCompare()
      else if (a === "reset") this.onReset()
    }
  }
}
