import { CachedScanner, compareResults, NOT_ON_LABEL, ScanResult } from "./ProductData"
import { COLORS, SceneKit } from "./SceneKit"
import { SugarStack } from "./SugarStack"
import { ResultCards } from "./ResultCards"

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

export type HLState = "start" | "result" | "waiting" | "compared"

@component
export class HonestLabelController extends BaseScriptComponent {
  @input boxMesh: RenderMesh
  @input unlitMaterial: Material
  /** Dev only: comma-separated actions run at start for screenshots, e.g. "scan,compare,scan". Keep empty. */
  @input devActions: string = ""

  state: HLState = "start"
  stack1: SugarStack = null
  stack2: SugarStack = null
  outcomeText: Text

  private kit: SceneKit
  private scanner = new CachedScanner()
  private table: SceneObject
  private startCard: SceneObject
  private hint: Text
  private cards1: ResultCards = null
  private compareGroup: SceneObject = null
  private scanBtn: SceneObject
  private compareBtn: SceneObject
  private resetBtn: SceneObject

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
    this.table = this.kit.group(this.sceneObject, "Table", TABLE_POS)
    this.kit.box(this.table, "TableTop", new vec3(90, 1, 45), new vec3(0, -0.5, 0), COLORS.table)
    this.buildStartCard()
    this.hint = this.kit.text(this.table, "Hint", "", 1.6, new vec3(0, 31, 0), COLORS.accent, 60)
    this.outcomeText = this.kit.text(this.table, "Outcome", "", 1.9, new vec3(0, 22, 0), COLORS.text, 60)
    this.buildButtons()
    this.setState("start")
    print("[HonestLabel] Ready")
    this.runDevActions()
  }

  private onUpdate(): void {
    const dt = getDeltaTime()
    if (this.stack1) this.stack1.update(dt)
    if (this.stack2) this.stack2.update(dt)
  }

  private buildStartCard(): void {
    const k = this.kit
    this.startCard = k.group(this.table, "StartCard", vec3.zero())
    k.text(this.startCard, "Title", "Honest Label", 3.2, new vec3(0, 20, 0), COLORS.accent)
    k.text(this.startCard, "Subtitle", "Hold up a product, then pinch Scan", 1.6,
      new vec3(0, 15, 0), COLORS.textDim, 50)
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

  onScan(): void {
    const r = this.scanner.next()
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
    this.clearCompare()
    if (this.stack1) this.stack1.destroy()
    if (this.cards1) this.cards1.destroy()
    this.stack1 = null
    this.cards1 = null
    this.scanner.reset()
    this.setState("start")
  }

  private showFirst(r: ScanResult): void {
    this.onResetSilently()
    this.stack1 = new SugarStack(this.kit, this.table, "Stack1", STACK1_POS, r)
    this.cards1 = new ResultCards(this.kit, this.table, "Cards1", STACK1_POS.add(CARDS_OFFSET), r)
    print(`[HonestLabel] Stack1 cubes: ${this.stack1.cubeCount === null ? NOT_ON_LABEL : this.stack1.cubeCount}`)
    this.setState("result")
  }

  private onResetSilently(): void {
    this.clearCompare()
    if (this.stack1) this.stack1.destroy()
    if (this.cards1) this.cards1.destroy()
    this.stack1 = null
    this.cards1 = null
  }

  private showCompare(r: ScanResult): void {
    this.cards1.root.enabled = false
    this.stack1.setPosition(COMPARE_LEFT)
    this.stack2 = new SugarStack(this.kit, this.table, "Stack2", COMPARE_RIGHT, r)
    this.compareGroup = this.kit.group(this.table, "CompareLabels", vec3.zero())
    this.nameTag(this.stack1, COMPARE_LEFT)
    this.nameTag(this.stack2, COMPARE_RIGHT)

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

  private clearCompare(): void {
    if (this.stack2) this.stack2.destroy()
    this.stack2 = null
    if (this.compareGroup) this.compareGroup.destroy()
    this.compareGroup = null
    if (this.outcomeText) this.outcomeText.text = ""
    if (this.stack1) this.stack1.setPosition(STACK1_POS)
    if (this.cards1) this.cards1.root.enabled = true
  }

  private runDevActions(): void {
    const actions = (this.devActions || "").split(",").map((a) => a.trim()).filter((a) => a.length > 0)
    for (const a of actions) {
      if (a === "scan") this.onScan()
      else if (a === "compare") this.onCompare()
      else if (a === "reset") this.onReset()
    }
  }
}
