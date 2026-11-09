import { Claim, ScanResult } from "./ProductData"

const TIMEOUT_S = 4
const WS_OPEN = 1

/**
 * Asks the scan bridge for one scan over a WebSocket.
 * Sends {"type":"scan"} and resolves with the bridge's scan_result (source "live").
 * Falls back to the cached result on scan_error, no connection, a bad reply,
 * or no reply within 4 s. Late replies are ignored.
 */
export class ScanClient {
  private socket: WebSocket = null
  private pending: { id: number; done: (r: ScanResult) => void } = null
  private nextId = 1
  private timer: DelayedCallbackEvent

  constructor(owner: BaseScriptComponent, private internet: InternetModule, private url: string,
              private fallback: () => ScanResult) {
    this.timer = owner.createEvent("DelayedCallbackEvent")
    this.timer.bind(() => this.fail("no reply within " + TIMEOUT_S + " s"))
  }

  get busy(): boolean {
    return this.pending !== null
  }

  request(done: (r: ScanResult) => void): void {
    if (this.pending) return
    this.pending = { id: this.nextId++, done }
    this.timer.reset(TIMEOUT_S)
    if (!this.internet) return this.fail("no InternetModule")
    try {
      if (this.socket && this.socket.readyState === WS_OPEN) {
        this.sendScan()
      } else {
        this.open()
      }
    } catch (e) {
      this.fail("could not connect: " + e)
    }
  }

  /** Drop the pending request (e.g. Reset pressed while scanning). */
  cancel(): void {
    this.pending = null
  }

  private open(): void {
    this.closeSocket()
    const s = this.internet.createWebSocket(this.url)
    this.socket = s
    s.binaryType = "blob"
    s.onopen = () => {
      if (this.socket === s) this.sendScan()
    }
    s.onmessage = (e: WebSocketMessageEvent) => {
      if (this.socket === s && typeof e.data === "string") this.onText(e.data)
    }
    s.onerror = () => {
      if (this.socket === s) this.fail("bridge not reachable")
    }
    s.onclose = () => {
      if (this.socket === s) {
        this.socket = null
        this.fail("connection closed")
      }
    }
  }

  private sendScan(): void {
    if (!this.pending) return
    this.socket.send(JSON.stringify({ type: "scan" }))
  }

  private onText(text: string): void {
    if (!this.pending) return // late or unrequested reply (e.g. S key in the bridge): ignore
    let msg: any
    try {
      msg = JSON.parse(text)
    } catch (e) {
      return this.fail("bad JSON from bridge")
    }
    if (msg && msg.type === "scan_error") return this.fail("scan_error: " + msg.error)
    if (msg && msg.type === "scan_result") {
      const r = ScanClient.toResult(msg)
      return r ? this.succeed(r) : this.fail("scan_result missing fields")
    }
  }

  /** Validate the bridge's scan_result; sugar_g null stays null ("Not on label"). */
  static toResult(m: any): ScanResult | null {
    if (typeof m.name !== "string" || m.name.length === 0) return null
    if (typeof m.verdict !== "string") return null
    const sugar = typeof m.sugar_g === "number" && m.sugar_g >= 0 ? m.sugar_g : null
    const claims: Claim[] = Array.isArray(m.claims)
      ? m.claims.filter((c: any) => c && typeof c.claim === "string" && typeof c.truth === "string").slice(0, 2)
      : []
    return {
      type: "scan_result",
      source: "live",
      name: m.name,
      sugar_g: sugar,
      serving: typeof m.serving === "string" ? m.serving : "",
      claims,
      verdict: m.verdict,
      confidence: m.confidence === "label" ? "label" : "estimate",
    }
  }

  private succeed(r: ScanResult): void {
    const p = this.pending
    this.pending = null
    print(`[HonestLabel] Bridge: live result "${r.name}"`)
    p.done(r)
  }

  private fail(reason: string): void {
    const p = this.pending
    if (!p) return
    this.pending = null
    print(`[HonestLabel] Bridge: using saved result (${reason})`)
    p.done(this.fallback())
  }

  private closeSocket(): void {
    const s = this.socket
    this.socket = null
    if (s) {
      try {
        s.close()
      } catch (e) {
        // already closed
      }
    }
  }
}
