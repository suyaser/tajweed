import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Recording, Reciter, Verse } from '../core/types'
import { needsBasmala, Player, segAt, type Seg } from './player'
import { ayahUrl } from './urls'
import { MIMES, pickMime, Recorder } from './recorder'

vi.mock('idb-keyval', () => {
  const db = new Map<string, unknown>()
  return {
    createStore: () => 'store',
    set: async (k: string, v: unknown) => { db.set(k, v) },
    values: async () => [...db.values()],
    del: async (k: string) => { db.delete(k) },
    delMany: async (ks: string[]) => { ks.forEach(k => db.delete(k)) },
    clear: async () => db.clear(),
  }
})

class FakeAudio extends EventTarget {
  src = ''; currentTime = 0; duration = 4; playbackRate = 1; defaultPlaybackRate = 1
  preload = ''; preservesPitch = false
  play = vi.fn(() => { queueMicrotask(() => this.emit('playing')); return Promise.resolve() })
  pause = vi.fn(); load = vi.fn(); removeAttribute = vi.fn()
  emit(t: string) { this.dispatchEvent(new Event(t)) }
}

const reciter: Reciter = { id: 'husary', nameAr: '', nameEn: '', folder: 'Husary_64kbps', style: 'murattal', hasTimings: true }
const verse = (a: number): Verse => ({ verseKey: `93:${a}`, text: '', words: [], tajweed: [] })

function setup(n = 2) {
  const el = new FakeAudio()
  const p = new Player(() => el as unknown as HTMLAudioElement)
  p.load(Array.from({ length: n }, (_, i) => verse(i + 1)), reciter, { skipBasmala: true })
  return { el, p }
}

it('ayahUrl pads surah and ayah', () => {
  expect(ayahUrl('Husary_Muallim_128kbps', '2:5')).toBe('https://everyayah.com/data/Husary_Muallim_128kbps/002005.mp3')
})

describe('segAt', () => {
  // words 0,1 timed; 2 untimed; 3-4 one segment
  const segs: Seg[] = [[0, 1, 0, 500], [1, 2, 520, 900], [3, 5, 1300, 2000]]
  it.each([
    [-1, -1], [0, 0], [250, 0], [500, 0],
    [510, 0], // gap between adjacent words: previous stays lit
    [600, 1], [900, 1],
    [1000, -1], // untimed word 2 is being spoken: none
    [1300, 2], [2000, 2], [2100, -1],
  ])('at %ims → %i', (ms, want) => expect(segAt(segs, ms)).toBe(want))
  it('empty', () => expect(segAt([], 10)).toBe(-1))
})

describe('player', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('fetch', vi.fn(() => Promise.resolve())) })

  it('gap: same length + 1s, countdown, then next ayah', async () => {
    const { el, p } = setup()
    p.setGap('same'); p.setRate(0.75)
    p.play()
    await vi.advanceTimersByTimeAsync(0)
    expect(p.state.status).toBe('playing')
    expect(el.src).toContain('093001.mp3')
    el.emit('ended') // 4s at 0.75 = 5333ms + 1s
    expect(p.state).toMatchObject({ status: 'gap', gapLeft: 7, gapTotal: 7 })
    await vi.advanceTimersByTimeAsync(1000)
    expect(p.state.gapLeft).toBe(6)
    await vi.advanceTimersByTimeAsync(5400)
    expect(p.state.status).not.toBe('gap')
    expect(p.state.index).toBe(1)
    expect(el.src).toContain('093002.mp3')
  })

  it('gap: fixed seconds; skipGap and pause/resume', async () => {
    const { el, p } = setup()
    p.setGap(3)
    p.play(); await vi.advanceTimersByTimeAsync(0)
    el.emit('ended')
    expect(p.state.gapLeft).toBe(3)
    p.pause()
    expect(p.state.status).toBe('paused')
    await vi.advanceTimersByTimeAsync(10_000)
    expect(p.state.index).toBe(0)
    p.play() // resumes by moving on
    expect(p.state.index).toBe(1)
    await vi.advanceTimersByTimeAsync(0)
    el.emit('ended')
    p.skipGap()
    expect(p.state.status).toBe('idle') // range done, 1 loop
  })

  it('loops the range N times then resolves whenDone(true)', async () => {
    const { el, p } = setup(2)
    p.setLoops(3)
    p.play()
    const done = p.whenDone()
    const seen: string[] = []
    for (let k = 0; k < 6; k++) {
      await vi.advanceTimersByTimeAsync(0)
      seen.push(`${p.state.loop}:${p.state.index}`)
      el.emit('ended')
    }
    expect(seen).toEqual(['1:0', '1:1', '2:0', '2:1', '3:0', '3:1'])
    expect(p.state).toMatchObject({ status: 'idle', index: 0, loop: 1 })
    await expect(done).resolves.toBe(true)
  })

  it('infinite loop keeps going', async () => {
    const { el, p } = setup(1)
    p.setLoops(Infinity)
    p.play()
    for (let k = 0; k < 20; k++) { await vi.advanceTimersByTimeAsync(0); el.emit('ended') }
    expect(p.state.loop).toBe(21)
    expect(p.state.status).not.toBe('idle')
  })

  it('error vs offline', async () => {
    const { el, p } = setup()
    p.play(); el.emit('error')
    expect(p.state).toMatchObject({ status: 'error' })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    p.play(); el.emit('error')
    expect(p.state).toMatchObject({ status: 'offline', error: 'Audio needs a connection.' })
  })

  it('playWord seeks to the slice and stops at its end', async () => {
    const { el, p } = setup()
    const v: Verse = { ...verse(1), timings: { husary: [[1, 1, 0, 400], [2, 2, 1000, 1500]] } }
    p.load([v], reciter)
    p.playWord(v, 1)
    expect(p.state.word).toEqual([1, 2])
    el.emit('loadedmetadata')
    expect(el.currentTime).toBeCloseTo(0.92)
    await vi.advanceTimersByTimeAsync(0)
    el.currentTime = 1.7; el.emit('timeupdate')
    expect(p.state.status).toBe('idle')
    expect(el.pause).toHaveBeenCalled()
  })

  it('playWords plays from the first word start to the last word end; untimed → whole ayah', async () => {
    const { el, p } = setup()
    const v: Verse = { ...verse(1), timings: { husary: [[1, 1, 0, 400], [2, 2, 1000, 1500], [3, 3, 1600, 2200]] } }
    p.load([v], reciter)
    p.playWords(v, 2, 3)
    expect(p.state.word).toEqual([1, 3])
    expect(p.state.basmala).toBe(false) // a slice never gets the basmala
    expect(el.src).toContain('093001.mp3')
    el.emit('loadedmetadata')
    expect(el.currentTime).toBeCloseTo(0.92)
    await vi.advanceTimersByTimeAsync(0)
    el.currentTime = 2.0; el.emit('timeupdate')
    expect(p.state.status).toBe('playing')
    el.currentTime = 2.33; el.emit('timeupdate')
    expect(p.state.status).toBe('idle')
    p.playWords(v, 3, 4) // word 4 untimed
    expect(p.state.word).toBeNull()
    expect(el.currentTime).toBe(0)
    await vi.advanceTimersByTimeAsync(0)
    el.emit('ended')
    expect(p.state.status).toBe('idle')
  })

  it('playWords from the first word starts at the file start (its timing can begin after the voice)', async () => {
    const { el, p } = setup()
    const v: Verse = { ...verse(1), timings: { husary: [[1, 1, 300, 900], [2, 2, 1000, 1500]] } }
    p.load([v], reciter)
    p.playWords(v, 1, 1)
    el.emit('loadedmetadata')
    expect(el.currentTime).toBe(0)
    expect(p.state.word).toEqual([0, 1]) // 0-based start, as in the test above
  })

  it('plays the basmala (001001) before ayah 1, unlit, then the ayah; skipBasmala turns it off', async () => {
    const el = new FakeAudio()
    const p = new Player(() => el as unknown as HTMLAudioElement)
    const v: Verse = { ...verse(1), timings: { husary: [[1, 1, 0, 400]] } }
    p.load([v, verse(2)], reciter)
    p.play()
    await vi.advanceTimersByTimeAsync(0)
    expect(el.src).toContain('/Husary_64kbps/001001.mp3')
    expect(p.state).toMatchObject({ basmala: true, verseKey: '93:1', status: 'playing' })
    el.currentTime = 0.2; el.emit('timeupdate')
    expect(p.state.word).toBeNull()
    el.emit('ended')
    expect(el.src).toContain('093001.mp3')
    expect(p.state).toMatchObject({ basmala: false, index: 0 })
    el.emit('ended')
    expect(el.src).toContain('093002.mp3')
    p.load([v], reciter, { skipBasmala: true })
    p.play()
    expect(el.src).toContain('093001.mp3')
  })
})

it('needsBasmala: ayah 1 of every surah but 1 and 9', () => {
  expect(['1:1', '9:1', '2:2', '2:1', '114:1'].map(needsBasmala)).toEqual([false, false, false, true, true])
})

describe('pickMime', () => {
  const stub = (ok: string[]) => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: (m: string) => ok.includes(m) })
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } })
  }
  it('prefers webm/opus', () => { stub(MIMES); expect(pickMime()).toBe('audio/webm;codecs=opus') })
  it('falls back to mp4 (iOS)', () => { stub(['audio/mp4', 'audio/aac']); expect(pickMime()).toBe('audio/mp4') })
  it('lets the browser choose when none match', () => { stub([]); expect(pickMime()).toBe('') })
  it('null without MediaRecorder', () => { vi.unstubAllGlobals(); expect(pickMime()).toBeNull() })
})

describe('Recorder', () => {
  it('stop() during the permission prompt releases the mic and gives no take (M6)', async () => {
    let grant!: (s: MediaStream) => void
    const track = { stop: vi.fn() }
    const MR = vi.fn()
    vi.stubGlobal('MediaRecorder', Object.assign(MR, { isTypeSupported: () => true }))
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => new Promise<MediaStream>(r => { grant = r }) } })
    const rec = new Recorder()
    const take = rec.start()
    expect(rec.state.status).toBe('requesting')
    rec.stop() // unmount while the prompt is open
    grant({ getTracks: () => [track] } as unknown as MediaStream)
    expect(await take).toBeNull()
    expect(track.stop).toHaveBeenCalled()
    expect(MR).not.toHaveBeenCalled()
    expect(rec.state.status).toBe('idle')
    vi.unstubAllGlobals()
  })
})

describe('recordings', () => {
  it('keeps the newest 5 per range', async () => {
    const { save, list, listAll } = await import('./recordings')
    const rec = (i: number, from = '93:1'): Recording => ({
      id: `${from}-${i}`, from, to: '93:5', createdAt: `2026-11-${10 + i}T00:00:00Z`, durationMs: 1, mime: 'audio/mp4', blob: new Blob(),
    })
    await save(rec(0, '1:1'))
    for (let i = 0; i < 7; i++) await save(rec(i))
    expect((await list('93:1', '93:5')).map(r => r.id)).toEqual([6, 5, 4, 3, 2].map(i => `93:1-${i}`))
    expect(await listAll()).toHaveLength(6)
  })
})
