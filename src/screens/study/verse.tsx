// Verse loading, audio and the example verse block shared by Learn, Review and Today.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { Example, Verse } from '../../core/types'
import { useData } from '../../core/store'
import { getVerse, RECITERS, wordSegments } from '../../quran'
import { usePlayer } from '../../audio/usePlayer'
import { VerseBlock, type TajweedSegment } from '../../components'
import { AudioControls, Callout, Chip, ExampleCard as KitExampleCard } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
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

/** Play / stop owned by one control: `playing` only while this control's playback runs. */
export function usePlayToggle(audio: StudyAudio) {
  const id = useId()
  const playing = audio.busy && audio.owner === id
  return {
    playing,
    tap: (start?: () => void) => {
      if (playing) return audio.stop()
      audio.setOwner(id)
      start?.()
    },
  }
}

/**
 * ▶ Play with a visible word (`text`) or an icon-only round button named by `label`; ❚❚ Stop while it plays. Offline
 * it says so instead (design §5.3 states).
 */
export function PlayButton({ label, onClick, audio, text, className }: {
  label: string; onClick?: () => void; audio: StudyAudio; text?: string; className?: string
}) {
  const p = usePlayToggle(audio)
  if (audio.offline) return <span className="text-caption text-on-surface-variant">{t('Audio needs a connection')}</span>
  const icon = <Icon name={p.playing ? 'pause' : 'play_arrow'} fill size={text ? 20 : 24} />
  return text ? (
    <Button variant="secondary" className={cn('min-h-12 shrink whitespace-normal', className)} onClick={() => p.tap(onClick)} disabled={!onClick} aria-pressed={p.playing}>
      {icon}{p.playing ? t('Stop') : text}
    </Button>
  ) : (
    <Button variant="secondary" size="icon" className={cn('border-none bg-primary-container text-on-primary-container hover:bg-primary-container/80', className)}
      onClick={() => p.tap(onClick)} disabled={!onClick} aria-pressed={p.playing}
      aria-label={p.playing ? t('Stop {x}', { x: label }) : t('Play {x}', { x: label })}>
      {icon}
    </Button>
  )
}

/** Slower (0.75×) and Loop: toggles, never a long-press (review plan "Now" 3). */
export function PlayOptions({ audio }: { audio: StudyAudio }) {
  if (audio.offline) return null
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Chip icon="speed" pressed={audio.slow} onClick={() => audio.setSlow(!audio.slow)}>{t('Slower')}</Chip>
      <Chip icon="repeat" pressed={audio.loop} onClick={() => audio.setLoop(!audio.loop)}>{t('Loop')}</Chip>
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
 * The example's audio row: ✓ Played · ▶ (56px) · Slower / Loop. Offline (or no ayah) it counts as played and says
 * to read aloud, so the learner is never blocked.
 */
export function ExampleAudio({ ex, audio, played, onPlayed }: { ex: Example; audio: StudyAudio; played: boolean; onPlayed: () => void }) {
  const vs = useVerse(ex.verseKey)
  const p = usePlayToggle(audio)
  const noAudio = audio.offline || vs.failed || audio.state.status === 'error'
  useEffect(() => { if (noAudio && !played) onPlayed() }, [noAudio]) // eslint-disable-line react-hooks/exhaustive-deps
  if (noAudio)
    return <Callout variant="note" icon="wifi_off"><span role="status">{t('Audio needs a connection. Read it aloud instead.')}</span></Callout>
  return (
    <>
      <AudioControls playing={p.playing} disabled={!vs.verse} played={played}
        onPlay={() => p.tap(vs.verse && (() => audio.example(vs.verse!, ex, onPlayed)))}
        slow={audio.slow} onSlow={() => audio.setSlow(!audio.slow)} loop={audio.loop} onLoop={() => audio.setLoop(!audio.loop)} />
      <span className="sr-only" role="status">{played ? t('Played') : ''}</span>
    </>
  )
}

/** Stepper props for the kit card footer: back freely, forward only to examples already reached (docs/10 §4.1). */
export function stepperNav(sp: ReturnType<typeof useStepper>, audio: StudyAudio) {
  const go = (i: number) => { if (i <= sp.reached && i !== sp.at) { audio.stop(); sp.go(i) } }
  return {
    index: sp.at, total: sp.n,
    onPrev: sp.at > 0 ? () => go(sp.at - 1) : undefined,
    onNext: sp.at < sp.reached ? () => go(sp.at + 1) : undefined,
    onPick: go,
    reached: sp.reached,
    played: sp.played,
  }
}

/**
 * One example (docs/10 §4.1): eyebrow `Example 1 of 3` · reference, the words with the focus highlighted, the note,
 * the audio row, and the whole ayah on request. `hidden` hides the words (Notice, by ear) while the audio works;
 * `audioRow={false}` leaves the audio to the caller (Say's numbered Listen card). `children` go under it.
 */
export function ExampleCard({ ex, eyebrow, audio, played, onPlayed, hidden = false, audioRow = true, nav, children, className }: {
  ex: Example; eyebrow?: ReactNode; audio: StudyAudio; played: boolean; onPlayed: () => void; hidden?: boolean; audioRow?: boolean
  nav?: ReturnType<typeof stepperNav>; children?: ReactNode; className?: string
}) {
  const vs = useVerse(ex.verseKey)
  const [whole, setWhole] = useState(false)
  const noAudio = audio.offline || vs.failed || audio.state.status === 'error'
  const hide = hidden && !noAudio
  return (
    <KitExampleCard index={nav?.index ?? 0} total={nav?.total ?? 1} eyebrow={eyebrow} onPrev={nav?.onPrev} onNext={nav?.onNext} onPick={nav?.onPick} reached={nav?.reached} played={nav?.played} className={className}
      reference={!hide && <span lang="ar">{verseRef(ex.verseKey)}</span>}
      controls={(audioRow || (!hide && vs.verse) || children) && (
        <>
          {audioRow && <ExampleAudio ex={ex} audio={audio} played={played} onPlayed={onPlayed} />}
          {!hide && vs.verse && (
            <div className="flex flex-col items-center gap-space-sm">
              <Button variant="tertiary" size="sm" aria-expanded={whole} onClick={() => setWhole(!whole)}>
                {whole ? t('Hide the whole ayah') : t('Show the whole ayah')}<Icon name={whole ? 'expand_less' : 'expand_more'} size={20} />
              </Button>
              {whole && <div className="w-full rounded-control bg-surface-container-low px-space-md"><ExampleVerse ex={ex} vs={vs} size="read" /></div>}
            </div>
          )}
          {children}
        </>
      )}>
      {hide ? (
        <span className="grid size-20 place-items-center rounded-full bg-surface-container text-on-surface-variant"><Icon name="hearing" size={36} /></span>
      ) : (
        <>
          <ExampleVerse ex={ex} vs={vs} spanOnly size="focus" reference={false} />
          {ex.note && <p className="max-w-[50ch] text-body-md text-on-surface-variant"><Tx>{ex.note}</Tx></p>}
        </>
      )}
    </KitExampleCard>
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
