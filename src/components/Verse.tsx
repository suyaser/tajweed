import { Fragment, memo, useCallback, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import type { ColourKey, Verse } from '../core/types'
import { surahName } from '../quran'
import { BASMALA_PREFIX } from '../quran/data'
import { arDigits } from './bidi'

/** A run of verse text; `colour` set = a tajweed rule from a named source (design §1.2). */
export interface TajweedSegment { text: string; colour?: ColourKey | null }
export type WordMark = 'lamp' | 'lamp-dotted' | 'ring' | 'found' | 'missed' | 'wrong'

/** A pause (waqf/sakt) or sajdah mark after a 1-based word (Verse.marks). */
export type PauseMark = NonNullable<Verse['marks']>[number]

const PAUSE_LABEL: Record<string, string> = {
  'ۖ': 'pause mark: continuing is better', 'ۗ': 'pause mark: stopping is better', 'ۘ': 'pause mark: stop',
  'ۙ': 'pause mark: do not stop', 'ۚ': 'pause mark: stopping allowed', 'ۛ': 'pause mark: stop at one of the pair',
  'ۜ': 'pause mark: sakt', '۩': 'prostration mark',
}

/** Tanzil 1:1 verbatim (the basmala removed from ayah 1 of the other surahs). */
const BASMALA = BASMALA_PREFIX.trim()

/** Surah title, and the basmala line for every surah except الفاتحة (its ayah 1) and التوبة (none). Not a numbered ayah. */
export function SurahOpening({ surah }: { surah: number }) {
  return (
    <span className="surah-open">
      <span className="surah-name" role="heading" aria-level={3}>سورة {surahName(surah)}</span>
      {surah !== 1 && surah !== 9 && (
        <span className="basmala">
          <span className="br" aria-hidden="true">﴿</span> {BASMALA} <span className="br" aria-hidden="true">﴾</span>
        </span>
      )}
    </span>
  )
}

const MARK_LABEL: Record<WordMark, string> = {
  lamp: 'playing', 'lamp-dotted': 'playing', ring: 'marked', found: 'found', missed: 'missed', wrong: 'not this rule',
}

/** Split segments on spaces into words, keeping colour runs that start or end mid-word. */
export function toWords(segments: TajweedSegment[]): TajweedSegment[][] {
  const words: TajweedSegment[][] = [[]]
  for (const seg of segments)
    seg.text.split(' ').forEach((part, i) => {
      if (i > 0) words.push([])
      if (part) words[words.length - 1].push({ text: part, colour: seg.colour })
    })
  return words.filter((w) => w.length)
}

interface WordTokenProps {
  parts: TajweedSegment[]
  mark?: WordMark
  tajweed?: boolean
  isolate?: ColourKey | null
  onTap?: () => void
  tabbable?: boolean
  /** Underline only these UTF-16 offsets [start, end) of the word (focusText). */
  q?: [number, number]
}

/** `text` starting at word offset `off`, with the part inside `q` wrapped in the question underline. */
function underline(text: string, off: number, q?: [number, number]): ReactNode {
  const a = q ? Math.max(0, q[0] - off) : 0, b = q ? Math.min(text.length, q[1] - off) : 0
  if (a >= b) return text
  return <>{text.slice(0, a)}<mark className="q">{text.slice(a, b)}</mark>{text.slice(b)}</>
}

export function WordToken({ parts, mark, tajweed = true, isolate, onTap, tabbable, q }: WordTokenProps) {
  const word = parts.map((p) => p.text).join('')
  let off = 0
  const inner = parts.map((p, i) => {
    const t = underline(p.text, off, q)
    off += p.text.length
    return p.colour && tajweed && (!isolate || isolate === p.colour) ? (
      <span key={i} className={`tj tj-${p.colour}${isolate ? ' tj-iso' : ''}`} data-rule={p.colour}>{t}</span>
    ) : (
      <Fragment key={i}>{t}</Fragment>
    )
  })
  if (!onTap) return <span className="w" data-mark={mark}>{inner}</span>
  return (
    <span
      className="w"
      data-w=""
      data-mark={mark}
      role="button"
      tabIndex={tabbable ? 0 : -1}
      aria-label={mark ? `${word}, ${MARK_LABEL[mark]}` : word}
      onClick={onTap}
    >
      {inner}
    </span>
  )
}

/** Roving tabindex over [data-w] words (design §7.1): ← next (RTL), → previous, Enter taps, Esc leaves. */
function roving(e: KeyboardEvent<HTMLElement>) {
  const ws = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-w]')]
  const i = ws.indexOf(document.activeElement as HTMLElement)
  if (i < 0) return
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ws[i].click(); return }
  if (e.key === 'Escape') { ws[i].blur(); return }
  const d = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0
  if (!d) return
  e.preventDefault()
  const next = ws[Math.max(0, Math.min(ws.length - 1, i + d))]
  ws[i].tabIndex = -1
  next.tabIndex = 0
  next.focus()
}

const join = (xs: ReactNode[]) => xs.flatMap((x, i) => (i ? [' ', x] : [x]))

interface WordsOpts {
  tajweed: boolean
  isolate?: ColourKey | null
  current?: number
  marks?: Record<number, WordMark>
  onWord?: (word: number, text: string) => void
  tabStop?: number
  pauses?: PauseMark[]
  q?: Record<number, [number, number]>
}

function tokens(segments: TajweedSegment[], o: WordsOpts, keyPrefix = '') {
  return toWords(segments).map((parts, i) => {
    const n = i + 1
    const ps = o.pauses?.filter((p) => p.after === n)
    const tok = (
      <WordToken
        key={keyPrefix + n}
        q={o.q?.[n]}
        parts={parts}
        mark={o.marks?.[n] ?? (o.current === n ? 'lamp' : undefined)}
        tajweed={o.tajweed}
        isolate={o.isolate}
        tabbable={o.onWord && n === (o.tabStop ?? 1)}
        onTap={o.onWord && (() => o.onWord!(n, parts.map((p) => p.text).join('')))}
      />
    )
    if (!ps?.length) return tok
    // NBSP: the mark is a combining sign shown on its own (as Tanzil writes it) and must not wrap away from its word.
    return (
      <Fragment key={keyPrefix + n}>
        {tok}
        {ps.map((p, j) => <span key={j} className="pause" role="img" aria-label={PAUSE_LABEL[p.mark] ?? 'pause mark'}>{'\u00a0' + p.mark}</span>)}
      </Fragment>
    )
  })
}

/** Offsets of the first `text` inside words from..to (1-based), per word; undefined when not found. */
function focusRanges(segments: TajweedSegment[], [from, to]: [number, number], text: string) {
  const words = toWords(segments).slice(from - 1, to).map((w) => w.map((p) => p.text).join(''))
  const i = words.join(' ').indexOf(text)
  if (i < 0 || !text) return undefined
  const q: Record<number, [number, number]> = {}
  let off = 0
  words.forEach((w, k) => {
    const a = Math.max(i, off), b = Math.min(i + text.length, off + w.length)
    if (a < b) q[from + k] = [a - off, b - off]
    off += w.length + 1
  })
  return q
}

export interface VerseBlockProps {
  /** Plain Uthmani text, or `segments` when tajweed colours are known. */
  text?: string
  segments?: TajweedSegment[]
  /** Caption: surah name + Arabic-Indic ayah, e.g. 'العصر ٢'. */
  reference?: string
  size?: 'inline' | 'read' | 'focus'
  /** Show tajweed colours from segments (default true). Quiz prompts pass false. */
  tajweed?: boolean
  /** 1-based inclusive word range: neutral question underline, never a tajweed hue. */
  focus?: [number, number]
  /** Underline only this substring (first occurrence inside `focus`); whole focus words if not found. */
  focusText?: string
  /** Pause / sajdah marks (Verse.marks), shown after their word. */
  pauses?: PauseMark[]
  /** Set when the text is a whole ayah: ayah 1 gets the surah title and basmala above it. */
  verseKey?: string
  /** 1-based word now playing: lamp. */
  current?: number
  marks?: Record<number, WordMark>
  /** Legend isolate: only this rule keeps its colour, underlined. */
  isolate?: ColourKey | null
  onWord?: (word: number, text: string) => void
  stopping?: boolean
  /** ▶ / › controls placed in the caption. */
  actions?: ReactNode
}

export function VerseBlock({
  text = '', segments, reference, size = 'inline', tajweed = true, focus, focusText, pauses, verseKey, current, marks, isolate, onWord, stopping, actions,
}: VerseBlockProps) {
  const capId = useId()
  const segs = segments ?? [{ text }]
  const q = focus && focusText ? focusRanges(segs, focus, focusText) : undefined
  const toks = tokens(segs, { tajweed, isolate, current, marks, onWord, tabStop: current ?? focus?.[0], pauses, q })
  const [surah, ayah] = (verseKey ?? '').split(':').map(Number)
  const body = focus && q
    ? [
        ...join(toks.slice(0, focus[1])),
        <span key="q" className="sr-only" lang="en"> (underlined: {focusText})</span>,
        focus[1] < toks.length ? ' ' : null,
        ...join(toks.slice(focus[1])),
      ]
    : focus
    ? [
        ...join(toks.slice(0, focus[0] - 1)),
        focus[0] > 1 ? ' ' : null,
        <mark key="q" className="q">
          {join(toks.slice(focus[0] - 1, focus[1]))}
          <span className="sr-only" lang="en"> (underlined)</span>
        </mark>,
        focus[1] < toks.length ? ' ' : null,
        ...join(toks.slice(focus[1])),
      ]
    : join(toks)
  const hasCaption = reference || stopping || actions
  return (
    <figure className={`verse verse-${size}`} lang="ar" dir="rtl" data-isolate={isolate ?? undefined} aria-describedby={hasCaption ? capId : undefined}>
      {ayah === 1 && <SurahOpening surah={surah} />}
      <p className="verse-text" onKeyDown={onWord ? roving : undefined}>
        <span className="br" aria-hidden="true">﴿</span>{'\u00A0'}{body}<span className="nowrap">{'\u00A0'}<span className="br" aria-hidden="true">﴾</span></span>
      </p>
      {hasCaption && (
        <figcaption id={capId}>
          {stopping && <em className="stop">◼ وقف · <span lang="en">stopping here</span></em>}
          {reference && <span className="ref">{reference}</span>}
          {actions}
        </figcaption>
      )}
    </figure>
  )
}

/** `pauses`: pass Verse.marks. Ayah 1 (n === 1) gets the surah title and basmala before it. */
export interface PassageAyah { key: string; n: number; text?: string; segments?: TajweedSegment[]; pauses?: PauseMark[] }

export interface PassageProps {
  ayahs: PassageAyah[]
  size?: 'inline' | 'read' | 'focus'
  tajweed?: boolean
  currentAyah?: string
  current?: { key: string; word: number }
  /** keyed `${verseKey}/${word}` */
  marks?: Record<string, WordMark>
  isolate?: ColourKey | null
  onWord?: (key: string, word: number, text: string) => void
  onAyah?: (key: string) => void
}

/** Multi-ayah block with inline ayah-end markers ﴿٥﴾, each a tap target that seeks to that ayah. */
export function Passage({ ayahs, size = 'read', tajweed = false, currentAyah, current, marks, isolate, onWord, onAyah }: PassageProps) {
  // Stable callbacks so a lit-word change re-renders only the ayah it touches (M7).
  const cb = useRef({ onWord, onAyah })
  cb.current = { onWord, onAyah }
  const word = useCallback((k: string, w: number, t: string) => cb.current.onWord?.(k, w, t), [])
  const ayah = useCallback((k: string) => cb.current.onAyah?.(k), [])
  return (
    <div className={`verse verse-${size} passage`} lang="ar" dir="rtl">
      <p className="verse-text" onKeyDown={onWord ? roving : undefined}>
        {ayahs.map((a, ai) => (
          <Fragment key={a.key}>
          {a.n === 1 && <SurahOpening surah={+a.key.split(':')[0]} />}
          <AyahRun
            a={a} tajweed={tajweed} isolate={isolate} marks={marks}
            isCurrent={currentAyah === a.key}
            word={current?.key === a.key ? current.word : undefined}
            tabStop={(current ? current.key === a.key : ai === 0) ? (current?.word ?? 1) : -1}
            onWord={onWord && word} onAyah={onAyah && ayah}
          />
          </Fragment>
        ))}
      </p>
    </div>
  )
}

const AyahRun = memo(function AyahRun({ a, tajweed, isolate, marks, isCurrent, word, tabStop, onWord, onAyah }: {
  a: PassageAyah; tajweed: boolean; isolate?: ColourKey | null; marks?: Record<string, WordMark>
  isCurrent: boolean; word?: number; tabStop: number
  onWord?: (key: string, word: number, text: string) => void; onAyah?: (key: string) => void
}) {
  const m: Record<number, WordMark> = {}
  for (const [k, v] of Object.entries(marks ?? {})) if (k.startsWith(a.key + '/')) m[+k.slice(a.key.length + 1)] = v
  const toks = tokens(a.segments ?? [{ text: a.text ?? '' }], {
    tajweed, isolate, marks: m, current: word, tabStop, pauses: a.pauses,
    onWord: onWord && ((w, t) => onWord(a.key, w, t)),
  }, a.key + '/')
  const end = `﴿${arDigits(a.n)}﴾`
  return (
    <span className="ayah" data-current={isCurrent || undefined}>
      {join(toks.slice(0, -1))}{toks.length > 1 && ' '}
      {/* the last word and its marker wrap together: ﴿٥﴾ never sits alone on a line (m17) */}
      <span className="nowrap">
        {toks[toks.length - 1]}{'\u00A0'}
        {onAyah ? (
          <button type="button" className="ayah-end" onClick={() => onAyah(a.key)} lang="en" aria-label={`Ayah ${a.n}`}>{end}</button>
        ) : (
          <span className="ayah-end">{end}</span>
        )}
      </span>{' '}
    </span>
  )
})
