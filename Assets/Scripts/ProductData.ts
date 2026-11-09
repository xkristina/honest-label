/**
 * Honest Label data: the scan_result message contract (bridge -> Lens) and
 * the cached results for the 3 demo products from devpost/design-brief.md.
 * Numbers are placeholders until the real labels are checked.
 */

export interface Claim {
  claim: string
  truth: string
}

export interface ScanResult {
  type: "scan_result"
  source: "live" | "cached"
  name: string
  /** Grams of sugar per serving, or null if not readable on the label. Never guessed. */
  sugar_g: number | null
  serving: string
  claims: Claim[]
  verdict: string
  confidence: "label" | "estimate"
}

/** 1 cube = 4 g. Null sugar has no cube count. */
export const GRAMS_PER_CUBE = 4

export function cubesFor(sugar_g: number | null): number | null {
  if (sugar_g === null || sugar_g === undefined) return null
  return Math.round(sugar_g / GRAMS_PER_CUBE)
}

export const NOT_ON_LABEL = "Not on label"

export const CACHED_PRODUCTS: ScanResult[] = [
  {
    type: "scan_result",
    source: "cached",
    name: "Cola (330 ml can)",
    sugar_g: 35,
    serving: "per can",
    claims: [
      { claim: "Natural flavours", truth: "Flavour made from natural sources in a lab, not fruit." },
      { claim: "Classic taste", truth: "Marketing words, no nutritional meaning." },
    ],
    verdict: "About 9 cubes of sugar, more than a child's whole daily limit.",
    confidence: "label",
  },
  {
    type: "scan_result",
    source: "cached",
    name: "Fruit juice box (200 ml)",
    sugar_g: 20,
    serving: "per box",
    claims: [
      { claim: "No added sugar", truth: "No sugar added, but fruit sugar is still sugar." },
      { claim: "Made with real fruit", truth: "Can be mostly concentrate." },
    ],
    verdict: "5 cubes of sugar. Healthier-sounding, still a sweet drink.",
    confidence: "label",
  },
  {
    type: "scan_result",
    source: "cached",
    name: "Bakery coco bread (wrapped)",
    sugar_g: null,
    serving: "no nutrition panel",
    claims: [
      { claim: "Fresh baked", truth: "Says when, not what's in it." },
      { claim: "Homestyle", truth: "No defined meaning." },
    ],
    verdict: "No nutrition label: Honest Label can't tell you, and won't guess.",
    confidence: "label",
  },
]

export interface CompareOutcome {
  /** 0 = first product is the better pick, 1 = second, null = no winner. */
  winner: 0 | 1 | null
  message: string
}

/** Lower sugar wins. Null sugar on either side, or equal sugar, has no winner. */
export function compareResults(a: ScanResult, b: ScanResult): CompareOutcome {
  if (a.sugar_g === null || b.sugar_g === null) {
    return { winner: null, message: "Can't compare: no sugar label" }
  }
  if (a.sugar_g === b.sugar_g) return { winner: null, message: "Same sugar" }
  const winner: 0 | 1 = a.sugar_g < b.sugar_g ? 0 : 1
  const diff = Math.abs(a.sugar_g - b.sugar_g)
  const name = (winner === 0 ? a : b).name
  return { winner, message: `${name}: ${diff} g less sugar` }
}

/** Hands out cached products in order 1 -> 2 -> 3, then repeats. */
export class CachedScanner {
  private index = 0

  next(): ScanResult {
    const r = CACHED_PRODUCTS[this.index % CACHED_PRODUCTS.length]
    this.index++
    return r
  }

  reset(): void {
    this.index = 0
  }
}
