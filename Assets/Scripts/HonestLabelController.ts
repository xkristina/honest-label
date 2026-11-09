import { CACHED_PRODUCTS, cubesFor, NOT_ON_LABEL } from "./ProductData"

/**
 * Honest Label main controller. Step A: logs the cached demo products so the
 * data can be checked in the Logger. Later steps add the start card, stack,
 * cards, compare and reset.
 */
@component
export class HonestLabelController extends BaseScriptComponent {
  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
  }

  private onStart(): void {
    CACHED_PRODUCTS.forEach((p, i) => {
      const cubes = cubesFor(p.sugar_g)
      const sugar = p.sugar_g === null ? NOT_ON_LABEL : `${p.sugar_g} g ${p.serving} = ${cubes} cubes`
      print(`[HonestLabel] Cached ${i + 1}: ${p.name} | ${sugar} | claims: ${p.claims.length}`)
    })
  }
}
