export const MIMES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/aac']
export const MAX_MS = 3 * 60_000

/** First supported mime; '' = let the browser choose; null = recording unsupported. */
export function pickMime(): string | null {
  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return null
  return MIMES.find(m => MediaRecorder.isTypeSupported?.(m)) ?? ''
}

export type RecStatus = 'idle' | 'requesting' | 'recording' | 'denied' | 'unsupported' | 'error'
export interface RecState { status: RecStatus; startedAt: number | null; error: string | null }
export interface RecResult { blob: Blob; durationMs: number; mime: string }

export class Recorder {
  state: RecState = { status: pickMime() === null ? 'unsupported' : 'idle', startedAt: null, error: null }
  private mr: MediaRecorder | null = null
  private listeners = new Set<() => void>()

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  getState = () => this.state
  private set(p: Partial<RecState>) { this.state = { ...this.state, ...p }; this.listeners.forEach(f => f()) }

  /** Resolves when recording stops (stop(), the 3-min guard, or unmount) with the take, or null if none. */
  async start(): Promise<RecResult | null> {
    if (this.mr || this.state.status === 'requesting') return null
    const mime = pickMime()
    if (mime === null) { this.set({ status: 'unsupported' }); return null }
    this.set({ status: 'requesting', error: null })
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      const name = (e as DOMException).name
      if (name === 'NotAllowedError' || name === 'SecurityError') this.set({ status: 'denied' })
      else this.set({ status: 'error', error: name === 'NotFoundError' ? 'No microphone found.' : String((e as Error).message ?? e) })
      return null
    }
    const release = () => stream.getTracks().forEach(t => t.stop())
    let mr: MediaRecorder
    try {
      mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    } catch (e) {
      release()
      this.set({ status: 'error', error: String((e as Error).message ?? e) })
      return null
    }
    return new Promise(resolve => {
      const chunks: Blob[] = []
      const t0 = Date.now()
      const guard = setTimeout(() => this.stop(), MAX_MS)
      const done = (r: RecResult | null, p: Partial<RecState>) => {
        clearTimeout(guard); release(); this.mr = null
        this.set({ startedAt: null, ...p }); resolve(r)
      }
      mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
      mr.onstop = () => {
        const type = mr.mimeType || mime || chunks[0]?.type || 'audio/mp4'
        const blob = new Blob(chunks, { type })
        done(blob.size ? { blob, durationMs: Date.now() - t0, mime: type } : null, { status: 'idle' })
      }
      mr.onerror = () => done(null, { status: 'error', error: 'Recording failed.' })
      this.mr = mr
      mr.start()
      this.set({ status: 'recording', startedAt: t0 })
    })
  }

  stop() { if (this.mr?.state === 'recording') this.mr.stop() }
}
