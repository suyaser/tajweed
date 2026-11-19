// Verse loading, audio and the example verse block shared by Learn, Review and Today.
import { useEffect, useId, useState, type ReactNode } from 'react'
import type { Example, Verse } from '../../core/types'
import { useData } from '../../core/store'
import { getVerse, RECITERS, wordSegments } from '../../quran'
import { usePlayer } from '../../audio/usePlayer'
import { VerseBlock, type TajweedSegment } from '../../components'
import { verseRef } from './helpers'

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

/** One player per screen; plays a whole ayah or the example's word as a slice. */
export function useStudyAudio() {
  const { settings } = useData()
  const reciter = RECITERS.find(r => r.id === settings.reciterId) ?? RECITERS[0]
  const { state, player } = usePlayer()
  const [owner, setOwner] = useState<string | null>(null) // the PlayButton that started the current playback
  const ayah = (v: Verse) => { player.load([v], reciter, { skipBasmala: true }); player.play() }
  /** Just the example's words (tajweed review M5): never the whole ayah when timings exist. */
  const example = (v: Verse, ex: Example) => {
    player.load([v], reciter, { skipBasmala: true })
    player.playWords(v, ex.wordFrom, ex.wordTo)
  }
  /** A whole passage from its first ayah (basmala as the player decides). */
  const passage = (vs: Verse[]) => { player.load(vs, reciter); player.play() }
  /** The example's words, then `then` once they finish (reciter, then me). */
  const exampleThen = (v: Verse, ex: Example, then: () => void) => {
    example(v, ex)
    const off = player.subscribe(() => {
      const s = player.getState().status
      if (s === 'idle' || s === 'error' || s === 'offline') { off(); if (s === 'idle') then() }
    })
  }
  const offline = state.status === 'offline' || (typeof navigator !== 'undefined' && navigator.onLine === false)
  return { state, player, reciter, ayah, example, passage, exampleThen, offline, busy: state.status === 'playing' || state.status === 'loading', stop: () => player.stop(), owner, setOwner }
}
export type StudyAudio = ReturnType<typeof useStudyAudio>

/** ▶ with a text label, ❚❚ while it plays (tap to stop); says so when audio is unavailable (design §5.3 states). */
export function PlayButton({ label, onClick, audio, children = '▶' }: { label: string; onClick?: () => void; audio: StudyAudio; children?: ReactNode }) {
  const id = useId()
  if (audio.offline) return <span className="t-sm muted s-play-off">Audio needs a connection</span>
  const playing = audio.busy && audio.owner === id
  const tap = () => {
    if (playing) return audio.stop()
    audio.setOwner(id)
    onClick?.()
  }
  return (
    <button type="button" className="icon-btn s-play-btn" onClick={tap} disabled={!onClick} aria-pressed={playing} aria-label={`${playing ? 'Stop' : 'Play'} ${label}`}>
      {playing ? <span aria-hidden="true">❚❚</span> : children}
    </button>
  )
}

export const flat = (words: TajweedSegment[][]) => words.flatMap((w, i) => (i ? [{ text: ' ' }, ...w] : w))

/**
 * The example's ayah from the real text, the example words underlined (neutral).
 * `coloured` shows the tajweed hues (card, feedback); quiz prompts pass false.
 * `spanOnly` shows just the example words (feedback). Until the ayah loads, or offline, it shows the example's own words.
 */
export function ExampleVerse({ ex, vs, coloured = false, spanOnly = false, size = 'inline', actions }: {
  ex: Example; vs: VerseState; coloured?: boolean; spanOnly?: boolean; size?: 'inline' | 'read' | 'focus'; actions?: ReactNode
}) {
  const v = vs.verse
  const reference = verseRef(ex.verseKey)
  if (!v) {
    const n = ex.text.split(' ').length
    return <VerseBlock text={ex.text} focus={spanOnly ? undefined : [1, n]} focusText={ex.focus} size={size} reference={reference} stopping={ex.stopping} actions={actions} tajweed={false} />
  }
  const words = wordSegments(v) as TajweedSegment[][]
  if (spanOnly) {
    const pauses = v.marks?.filter(m => m.after >= ex.wordFrom && m.after <= ex.wordTo).map(m => ({ ...m, after: m.after - ex.wordFrom + 1 }))
    return <VerseBlock segments={flat(words.slice(ex.wordFrom - 1, ex.wordTo))} pauses={pauses} size={size} tajweed={coloured} actions={actions} />
  }
  return (
    <VerseBlock
      segments={flat(words)} focus={[ex.wordFrom, ex.wordTo]} focusText={ex.focus} pauses={v.marks} verseKey={v.verseKey}
      tajweed={coloured} size={size} reference={reference} stopping={ex.stopping} actions={actions}
    />
  )
}
