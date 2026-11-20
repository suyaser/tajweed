// Verse loading, audio and the example verse block shared by Learn, Review and Today.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { Example, Verse } from '../../core/types'
import { useData } from '../../core/store'
import { getVerse, RECITERS, wordSegments } from '../../quran'
import { usePlayer } from '../../audio/usePlayer'
import { Card, VerseBlock, type TajweedSegment } from '../../components'
import { verseRef } from './helpers'
import { t } from '../../i18n'
import { Tx } from './i18n'

export interface VerseState { verse?: Verse; failed?: boolean }

/** Loads one ayah by key. `failed` = not available (offline and not cached). */
export function useVerse(key?: string): VerseState {
  const [s, set] = useState<VerseState & { key?: string }>({})
  useEffect(() => {
    if (!key) return
    let live = true
    getVerse(key).then(
      v => live && set({ key, verse: v, failed: !v }),
      () => live && set({ key, failed: true }),
    )
    return () => { live = false }
  }, [key])
  return s.key === key ? s : {}
}

/**
 * One player per screen; plays a whole ayah or the example's word as a slice. `slow` (0.75×) and `loop` are
 * per screen, shared by every card on it (spec 09 §3 "slowed, looped on tap"; review plan "Now" 3).
 */
export function useStudyAudio() {
  const { settings } = useData()
  const reciter = RECITERS.find(r => r.id === settings.reciterId) ?? RECITERS[0]
  const { state, player } = usePlayer()
  const [owner, setOwner] = useState<string | null>(null) // the PlayButton that started the current playback
  const [loop, setLoopState] = useState(false)
  const loopRef = useRef(loop)
  loopRef.current = loop
  const gen = useRef(0) // bumped by every new play and every stop: a stale loop or `then` never fires
  const ayah = (v: Verse) => { gen.current++; player.load([v], reciter, { skipBasmala: true }); player.play() }
  /**
   * Just the example's words (tajweed review M5): never the whole ayah when timings exist. `then` runs once, when
   * the words first finish; with Loop on they replay after a short breath until stopped.
   */
  const example = (v: Verse, ex: Example, then?: () => void, once = false) => {
    const g = ++gen.current
    const run = () => {
      player.load([v], reciter, { skipBasmala: true })
      player.playWords(v, ex.wordFrom, ex.wordTo)
      const off = player.subscribe(() => {
        const s = player.getState().status
        if (s !== 'idle' && s !== 'error' && s !== 'offline') return
        off()
        if (s !== 'idle' || g !== gen.current) return
        then?.()
        then = undefined
        if (!once && loopRef.current) setTimeout(() => { if (g === gen.current && loopRef.current) run() }, 700)
      })
    }
    run()
  }
  /** A whole passage from its first ayah (basmala as the player decides); Loop repeats it until stopped. */
  const passage = (vs: Verse[]) => { gen.current++; player.load(vs, reciter); player.setLoops(loopRef.current ? Infinity : 1); player.play() }
  /** The example's words once, then `then` once they finish (reciter, then me). */
  const exampleThen = (v: Verse, ex: Example, then: () => void) => example(v, ex, then, true)
  const setLoop = (on: boolean) => { setLoopState(on); loopRef.current = on; player.setLoops(on ? Infinity : 1) }
  const offline = state.status === 'offline' || (typeof navigator !== 'undefined' && navigator.onLine === false)
  return {
    state, player, reciter, ayah, example, passage, exampleThen, offline, busy: state.status === 'playing' || state.status === 'loading',
    stop: () => { gen.current++; player.stop() }, owner, setOwner,
    slow: state.rate === 0.75, setSlow: (on: boolean) => player.setRate(on ? 0.75 : 1), loop, setLoop,
  }
}
export type StudyAudio = ReturnType<typeof useStudyAudio>

/**
 * ▶ with a text label, ❚❚ while it plays (tap to stop); says so when audio is unavailable (design §5.3 states).
 * `text` shows a visible word next to the glyph (example cards: ▶ Play / ❚❚ Stop / ↻ Play again).
 */
export function PlayButton({ label, onClick, audio, children = '▶', text, big }: {
  label: string; onClick?: () => void; audio: StudyAudio; children?: ReactNode; text?: string; big?: boolean
}) {
  const id = useId()
  if (audio.offline) return <span className="t-sm muted s-play-off">{t('Audio needs a connection')}</span>
  const playing = audio.busy && audio.owner === id
  const tap = () => {
    if (playing) return audio.stop()
    audio.setOwner(id)
    onClick?.()
  }
  return (
    <button type="button" className={`icon-btn s-play-btn${big ? ' s-play-big' : ''}`} onClick={tap} disabled={!onClick} aria-pressed={playing}
      aria-label={text ? undefined : playing ? t('Stop {x}', { x: label }) : t('Play {x}', { x: label })}>
      {playing ? <span aria-hidden="true">❚❚</span> : <span aria-hidden={!!text}>{children}</span>}
      {text && <span>{playing ? t('Stop') : text}</span>}
    </button>
  )
}

/** Slower (0.75×) and Loop: text toggles, never a long-press (review plan "Now" 3). */
export function PlayOptions({ audio }: { audio: StudyAudio }) {
  if (audio.offline) return null
  return (
    <span className="s-play-opts">
      <button type="button" className="s-toggle" aria-pressed={audio.slow} onClick={() => audio.setSlow(!audio.slow)}>{t('Slower')}</button>
      <button type="button" className="s-toggle" aria-pressed={audio.loop} onClick={() => audio.setLoop(!audio.loop)}>{t('Loop')}</button>
    </span>
  )
}

export const flat = (words: TajweedSegment[][]) => words.flatMap((w, i) => (i ? [{ text: ' ' }, ...w] : w))

/**
 * The example's ayah from the real text, the focus letters highlighted (docs/10 §2). Never tajweed colours.
 * `spanOnly` shows just the example words. Until the ayah loads, or offline, it shows the example's own words.
 */
export function ExampleVerse({ ex, vs, spanOnly = false, size = 'inline', actions, reference = !spanOnly }: {
  ex: Example; vs: VerseState; spanOnly?: boolean; size?: 'inline' | 'read' | 'focus'; actions?: ReactNode; reference?: boolean
}) {
  const v = vs.verse
  const ref = reference ? verseRef(ex.verseKey) : undefined
  if (!v) {
    const n = ex.text.split(' ').length
    return <VerseBlock text={ex.text} focus={[1, n]} focusText={ex.focus} size={size} reference={ref} stopping={ex.stopping} actions={actions} tajweed={false} />
  }
  const words = wordSegments(v) as TajweedSegment[][]
  if (spanOnly) {
    const pauses = v.marks?.filter(m => m.after >= ex.wordFrom && m.after <= ex.wordTo).map(m => ({ ...m, after: m.after - ex.wordFrom + 1 }))
    return (
      <VerseBlock segments={flat(words.slice(ex.wordFrom - 1, ex.wordTo))} focus={[1, ex.wordTo - ex.wordFrom + 1]} focusText={ex.focus}
        pauses={pauses} size={size} tajweed={false} reference={ref} stopping={ex.stopping} actions={actions} />
    )
  }
  return (
    <VerseBlock
      segments={flat(words)} focus={[ex.wordFrom, ex.wordTo]} focusText={ex.focus} pauses={v.marks} verseKey={v.verseKey}
      tajweed={false} size={size} reference={ref} stopping={ex.stopping} actions={actions}
    />
  )
}

/**
 * One numbered example (docs/10 §4.1): eyebrow `Example 1 of 3` · reference, the words with the focus highlighted,
 * the note, ▶ Play / ✓ Played, Slower / Loop, and the whole ayah on request. Offline it counts as played.
 * `hidden` hides the words (Notice, by ear) while the audio works. `children` go under the controls (Say rows).
 */
export function ExampleCard({ ex, eyebrow, audio, played, onPlayed, hidden = false, children }: {
  ex: Example; eyebrow: ReactNode; audio: StudyAudio; played: boolean; onPlayed: () => void; hidden?: boolean; children?: ReactNode
}) {
  const vs = useVerse(ex.verseKey)
  const [whole, setWhole] = useState(false)
  const noAudio = audio.offline || vs.failed || audio.state.status === 'error'
  useEffect(() => { if (noAudio && !played) onPlayed() }, [noAudio]) // eslint-disable-line react-hooks/exhaustive-deps
  const hide = hidden && !noAudio
  return (
    <Card level="e2" className="s-excard">
      <p className="s-excard-top t-sm muted"><span className="eyebrow">{eyebrow}</span>{!hide && <span lang="ar">{verseRef(ex.verseKey)}</span>}</p>
      {!hide && <ExampleVerse ex={ex} vs={vs} spanOnly size="focus" />}
      {!hide && ex.note && <p className="t-sm muted s-center"><Tx>{ex.note}</Tx></p>}
      {noAudio ? (
        <p className="t-sm muted s-center" role="status">{t('Audio needs a connection. Read it aloud instead.')}</p>
      ) : (
        <div className="s-excard-play">
          <PlayButton big audio={audio} label={verseRef(ex.verseKey)} text={played ? t('Play again') : t('Play')}
            onClick={vs.verse && (() => audio.example(vs.verse!, ex, onPlayed))}>{played ? '↻' : '▶'}</PlayButton>
          <span className="s-played" role="status">{played && <><span aria-hidden="true">✓ </span>{t('Played')}</>}</span>
        </div>
      )}
      {!noAudio && <PlayOptions audio={audio} />}
      {!hide && vs.verse && (
        <>
          <button type="button" className="s-linkbtn" aria-expanded={whole} onClick={() => setWhole(!whole)}>
            {whole ? t('Hide the whole ayah') : t('Show the whole ayah')} <span aria-hidden="true">{whole ? '▴' : '▾'}</span>
          </button>
          {whole && <ExampleVerse ex={ex} vs={vs} size="read" />}
        </>
      )}
      {children}
    </Card>
  )
}

/** The dot row under a stepper: one 48px button per example, filled once played; only reached ones go back. */
export function Dots({ n, at, reached, played, onPick }: { n: number; at: number; reached: number; played: (i: number) => boolean; onPick: (i: number) => void }) {
  return (
    <ol className="s-dots" aria-label={t('Examples')}>
      {Array.from({ length: n }, (_, i) => (
        <li key={i}>
          <button type="button" disabled={i > reached} aria-current={i === at ? 'step' : undefined} data-played={played(i) || undefined}
            onClick={() => onPick(i)} aria-label={t('Example {n} of {m}', { n: i + 1, m: n }) + (played(i) ? t(', played') : '')}>
            <i aria-hidden="true" />
          </button>
        </li>
      ))}
    </ol>
  )
}

/** Stepper state shared by Hear, Say and the Recite fallback: one card at a time, fixed order. */
export function useStepper(n: number) {
  const [at, setAt] = useState(0)
  const [reached, setReached] = useState(0)
  const [played, setPlayed] = useState<number[]>([])
  return {
    at, reached, n, last: at >= n - 1,
    played: (i: number) => played.includes(i),
    allPlayed: played.length >= n,
    markPlayed: (i: number) => setPlayed(p => (p.includes(i) ? p : [...p, i])),
    go: (i: number) => { setAt(i); setReached(r => Math.max(r, i)) },
  }
}
