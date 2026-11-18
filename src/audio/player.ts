import type { Reciter, Verse } from '../core/types'
import { ayahUrl } from './urls'

/**
 * One segment as used inside the player (converted from the 1-based inclusive bundled data by segsOf):
 * [firstWord, endWord, startMs, endMs], word indices 0-based into `Verse.words`, endWord exclusive
 * (raw quran-align / QF format; one segment can cover two words).
 */
export type Seg = [number, number, number, number]
export type Gap = 'off' | 'same' | number // 'same' = ayah's own length + 1s (spec F5); number = fixed seconds
export type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'gap' | 'error' | 'offline'

export interface PlayerState {
  status: Status
  index: number // current ayah in the queue
  verseKey: string | null
  word: [number, number] | null // lit words, 0-based, end exclusive
  loop: number // current pass, 1-based
  loops: number // passes to play; Infinity = forever
  gap: Gap
  gapLeft: number // whole seconds left in the repeat gap (countdown)
  gapTotal: number
  rate: 0.75 | 1
  hasTimings: boolean
  error: string | null
  clip: boolean // playing a recording (playSrc), not the reciter
}

const PAD_BEFORE = 0.08 // s; quran-align error is < 73ms on average
const PAD_AFTER = 0.12

/** Segment being spoken at `ms`. Between two adjacent words the previous one stays lit;
 *  if an untimed word sits in the gap, or before the first / after the last segment: -1. */
export function segAt(segs: Seg[], ms: number): number {
  let lo = 0, hi = segs.length - 1, i = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (segs[mid][2] <= ms) { i = mid; lo = mid + 1 } else hi = mid - 1
  }
  if (i < 0 || ms <= segs[i][3]) return i
  const next = segs[i + 1]
  return next && next[0] === segs[i][1] ? i : -1
}

/** Bundled data (public/data, src/quran) stores segments 1-based and inclusive: [wordFrom, wordTo, startMs, endMs].
 *  The player works 0-based, end exclusive, so convert once here. Memoised per verse+reciter. */
const segCache = new WeakMap<object, Record<string, Seg[]>>()
export function segsOf(verse: Verse | undefined, reciterId: string): Seg[] | undefined {
  const raw = verse?.timings?.[reciterId]
  if (!verse || !raw) return undefined
  const byR = segCache.get(verse) ?? {}
  if (!byR[reciterId]) { byR[reciterId] = raw.map(([a, b, s, e]) => [a - 1, b, s, e] as Seg); segCache.set(verse, byR) }
  return byR[reciterId]
}

export const segForWord = (segs: Seg[] | undefined, w: number) => segs?.find(s => s[0] <= w && w < s[1])

const raf = (f: () => void) =>
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(f, 16)

const initial: PlayerState = {
  status: 'idle', index: 0, verseKey: null, word: null, loop: 1, loops: 1, gap: 'off',
  gapLeft: 0, gapTotal: 0, rate: 1, hasTimings: false, error: null, clip: false,
}

export class Player {
  state = initial
  private el: HTMLAudioElement | null = null
  private verses: Verse[] = []
  private reciter: Reciter | null = null
  private listeners = new Set<() => void>()
  private waiters: ((ok: boolean) => void)[] = []
  private gapTimer: ReturnType<typeof setInterval> | undefined
  private sliceEnd: number | null = null // word slice / single-ayah play: stop here (s)
  private resumeAdvances = false // paused during a gap
  private ticking = false

  constructor(private createAudio: () => HTMLAudioElement = () => new Audio()) {}

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  getState = () => this.state
  private set(p: Partial<PlayerState>) { this.state = { ...this.state, ...p }; this.listeners.forEach(f => f()) }

  load(verses: Verse[], reciter: Reciter) {
    this.stop()
    this.verses = verses
    this.reciter = reciter
    this.set({
      verseKey: verses[0]?.verseKey ?? null,
      hasTimings: reciter.hasTimings && verses.some(v => !!v.timings?.[reciter.id]?.length),
    })
  }

  /** Call from a user gesture (iOS). Resumes, retries after error/offline, or starts the queue. */
  play() {
    const s = this.state.status
    if (s === 'playing' || s === 'loading') return
    if (s === 'gap') return this.skipGap()
    if (s === 'paused' && this.resumeAdvances) { this.resumeAdvances = false; return this.advance() }
    if (s === 'paused' && this.el) { this.set({ status: 'loading' }); this.el.play().catch(e => this.rejected(e)); return }
    this.start()
  }

  pause() {
    if (this.state.status === 'gap') { this.clearGap(); this.resumeAdvances = true }
    this.el?.pause()
    this.sliceEnd = null
    if (this.state.status !== 'idle') this.set({ status: 'paused', word: null })
  }

  toggle() { const s = this.state.status; s === 'playing' || s === 'loading' || s === 'gap' ? this.pause() : this.play() }

  stop() {
    this.clearGap()
    this.el?.pause()
    this.sliceEnd = null
    this.resumeAdvances = false
    this.set({ status: 'idle', index: 0, verseKey: this.verses[0]?.verseKey ?? null, word: null, loop: 1, error: null, clip: false })
    this.settle(false)
  }

  /** Jump to ayah `i` (tap ayah number / scrubber). Keeps playing if it was. */
  seek(i: number) {
    if (!this.verses.length) return
    i = Math.max(0, Math.min(this.verses.length - 1, i))
    const s = this.state.status
    this.clearGap()
    this.resumeAdvances = false
    this.set({ index: i, verseKey: this.verses[i].verseKey, word: null })
    if (s === 'playing' || s === 'loading' || s === 'gap') this.start()
    else { this.el?.pause(); this.set({ status: 'idle' }) }
  }
  next() { this.seek(this.state.index + 1) }
  prev() { this.seek(this.state.index - 1) }
  skipGap() { if (this.state.status === 'gap') { this.clearGap(); this.advance() } }

  setRate(rate: 0.75 | 1) {
    if (this.el) this.el.playbackRate = this.el.defaultPlaybackRate = rate
    this.set({ rate })
  }
  setLoops(loops: number) { this.set({ loops }) }
  setGap(gap: Gap) { this.set({ gap }) }

  /** Play one word as a slice of its ayah file. Untimed word: plays the whole ayah once. Call from a gesture. */
  playWord(verse: Verse, wordIdx: number) {
    if (!this.reciter) return
    let i = this.verses.findIndex(v => v.verseKey === verse.verseKey)
    if (i < 0) { this.load([verse], this.reciter); i = 0 }
    const seg = segForWord(segsOf(verse, this.reciter.id), wordIdx)
    this.clearGap()
    this.resumeAdvances = false
    this.set({ index: i, verseKey: verse.verseKey })
    this.start(seg ? Math.max(0, seg[2] / 1000 - PAD_BEFORE) : 0)
    this.sliceEnd = seg ? seg[3] / 1000 + PAD_AFTER : Infinity
    if (seg) this.set({ word: [seg[0], seg[1]] })
  }

  /** Play any src (a recording's object URL) on the same, already-unlocked element. Resolves true when it ends. */
  playSrc(src: string): Promise<boolean> {
    this.stop()
    const a = this.audio()
    a.src = src
    a.playbackRate = a.defaultPlaybackRate = 1
    this.set({ status: 'loading', clip: true, word: null })
    a.play().catch(e => this.rejected(e))
    return this.whenDone()
  }

  /** Resolves true when the queue (all loops) or a playSrc clip finishes, false on stop/error/reload. */
  whenDone() { return new Promise<boolean>(r => this.waiters.push(r)) }

  /** Release the element (unmount). The player stays usable; a new element is made on the next play. */
  destroy() {
    this.stop()
    if (this.el) { this.el.removeAttribute('src'); this.el.load(); this.el = null }
  }

  private settle(ok: boolean) { const w = this.waiters; this.waiters = []; w.forEach(f => f(ok)) }

  private audio() {
    if (this.el) return this.el
    const a = (this.el = this.createAudio())
    a.preload = 'auto'
    a.preservesPitch = true
    ;(a as unknown as { webkitPreservesPitch: boolean }).webkitPreservesPitch = true // Safari < 17
    const on = (t: string, f: () => void) => a.addEventListener(t, () => { if (a === this.el) f() })
    on('playing', () => { this.set({ status: 'playing', error: null }); this.tick() })
    on('waiting', () => this.set({ status: 'loading' }))
    on('timeupdate', () => this.sync())
    on('ended', () => this.ended())
    on('error', () => this.fail())
    return a
  }

  private start(offset = 0) {
    const v = this.verses[this.state.index]
    if (!v || !this.reciter) return
    const a = this.audio()
    const url = ayahUrl(this.reciter.folder, v.verseKey)
    this.sliceEnd = null
    if (a.src !== url) {
      a.src = url
      if (offset) a.addEventListener('loadedmetadata', () => { a.currentTime = offset }, { once: true })
    } else a.currentTime = offset
    a.playbackRate = a.defaultPlaybackRate = this.state.rate
    this.set({ status: 'loading', verseKey: v.verseKey, word: null, error: null, gapLeft: 0, clip: false })
    a.play().catch(e => this.rejected(e))
    const nxt = this.verses[this.state.index + 1]
    // Warm the HTTP / service-worker cache for the next ayah (files are ~100 KB).
    if (nxt && typeof fetch === 'function') fetch(ayahUrl(this.reciter.folder, nxt.verseKey)).catch(() => {})
  }

  private rejected(e: unknown) {
    const name = (e as DOMException)?.name
    if (name === 'AbortError') return // src changed mid-load
    if (name === 'NotAllowedError') return this.set({ status: 'paused' }) // not in a user gesture: wait for a tap
    this.fail()
  }

  private fail() {
    this.clearGap()
    this.sliceEnd = null
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    this.set({
      status: offline ? 'offline' : 'error', word: null, clip: false,
      error: offline ? 'Audio needs a connection.' : "Couldn't load the recitation.",
    })
    this.settle(false)
  }

  private ended() {
    if (this.state.clip) { this.set({ status: 'idle', clip: false }); return this.settle(true) }
    if (this.sliceEnd !== null) { this.sliceEnd = null; return this.set({ status: 'idle', word: null }) }
    const { gap, rate } = this.state
    const dur = this.el?.duration ?? 0
    const ms = gap === 'off' ? 0 : gap === 'same' ? (dur * 1000) / rate + 1000 : gap * 1000
    this.set({ word: null })
    if (ms > 0 && Number.isFinite(ms)) this.startGap(ms)
    else this.advance()
  }

  private startGap(ms: number) {
    const end = Date.now() + ms
    const left = () => Math.max(0, Math.ceil((end - Date.now()) / 1000))
    this.set({ status: 'gap', gapTotal: Math.ceil(ms / 1000), gapLeft: left() })
    this.gapTimer = setInterval(() => {
      if (Date.now() >= end) { this.clearGap(); this.advance() }
      else if (left() !== this.state.gapLeft) this.set({ gapLeft: left() })
    }, 100)
  }

  private clearGap() {
    clearInterval(this.gapTimer)
    this.gapTimer = undefined
    if (this.state.gapLeft) this.set({ gapLeft: 0 })
  }

  private advance() {
    let { index, loop } = this.state
    if (++index >= this.verses.length) {
      index = 0
      if (++loop > this.state.loops) {
        this.set({ status: 'idle', index: 0, verseKey: this.verses[0]?.verseKey ?? null, loop: 1, word: null })
        return this.settle(true)
      }
    }
    this.set({ index, loop })
    this.start()
  }

  private tick() {
    if (this.ticking) return
    this.ticking = true
    const loop = () => {
      if (this.state.status !== 'playing') { this.ticking = false; return }
      this.sync()
      raf(loop)
    }
    raf(loop)
  }

  private sync() {
    const a = this.el
    if (!a || this.state.clip) return
    if (this.sliceEnd !== null) {
      if (a.currentTime >= this.sliceEnd) { a.pause(); this.sliceEnd = null; this.set({ status: 'idle', word: null }) }
      return
    }
    const segs = this.reciter && segsOf(this.verses[this.state.index], this.reciter.id)
    if (!segs) return
    const i = segAt(segs, a.currentTime * 1000)
    const w: [number, number] | null = i < 0 ? null : [segs[i][0], segs[i][1]]
    const cur = this.state.word
    if (w?.[0] !== cur?.[0] || w?.[1] !== cur?.[1]) this.set({ word: w })
  }
}
