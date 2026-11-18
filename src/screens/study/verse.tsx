// Verse loading, audio and the example verse block shared by Learn, Review and Today.
import { useEffect, useState, type ReactNode } from 'react'
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
  const ayah = (v: Verse) => { player.load([v], reciter); player.play() }
  // ponytail: Player has no multi-word slice; a one-word example plays that word, longer ones the whole ayah.
  const example = (v: Verse, ex: Example) => {
    if (ex.wordFrom !== ex.wordTo) return ayah(v)
    player.load([v], reciter)
    player.playWord(v, ex.wordFrom - 1)
  }
  const offline = state.status === 'offline' || (typeof navigator !== 'undefined' && navigator.onLine === false)
  return { state, player, reciter, ayah, example, offline, busy: state.status === 'playing' || state.status === 'loading', stop: () => player.stop() }
}
export type StudyAudio = ReturnType<typeof useStudyAudio>

/** ▶ with a text label; says so when audio is unavailable (design §5.3 states). */
export function PlayButton({ label, onClick, audio, children = '▶' }: { label: string; onClick?: () => void; audio: StudyAudio; children?: ReactNode }) {
  if (audio.offline) return <span className="t-sm muted s-play-off">Audio needs a connection</span>
  return (
    <button type="button" className="icon-btn s-play-btn" onClick={onClick} disabled={!onClick} aria-label={`Play ${label}`}>
      {children}
    </button>
  )
}

const flat = (words: TajweedSegment[][]) => words.flatMap((w, i) => (i ? [{ text: ' ' }, ...w] : w))

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
    return <VerseBlock text={ex.text} focus={spanOnly ? undefined : [1, n]} size={size} reference={reference} stopping={ex.stopping} actions={actions} tajweed={false} />
  }
  const words = wordSegments(v) as TajweedSegment[][]
  if (spanOnly)
    return <VerseBlock segments={flat(words.slice(ex.wordFrom - 1, ex.wordTo))} size={size} tajweed={coloured} actions={actions} />
  return (
    <VerseBlock
      segments={flat(words)} focus={[ex.wordFrom, ex.wordTo]} tajweed={coloured} size={size}
      reference={reference} stopping={ex.stopping} actions={actions}
    />
  )
}
