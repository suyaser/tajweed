import { useId, type KeyboardEvent, type ReactNode } from 'react'
import type { ColourKey } from '../core/types'
import { arDigits } from './bidi'

/** A run of verse text; `colour` set = a tajweed rule from a named source (design §1.2). */
export interface TajweedSegment { text: string; colour?: ColourKey | null }
export type WordMark = 'lamp' | 'lamp-dotted' | 'ring' | 'found' | 'missed' | 'wrong'

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
}

export function WordToken({ parts, mark, tajweed = true, isolate, onTap, tabbable }: WordTokenProps) {
  const word = parts.map((p) => p.text).join('')
  const inner = parts.map((p, i) =>
    p.colour && tajweed && (!isolate || isolate === p.colour) ? (
      <span key={i} className={`tj tj-${p.colour}${isolate ? ' tj-iso' : ''}`} data-rule={p.colour}>{p.text}</span>
    ) : (
      p.text
    ),
  )
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
}

function tokens(segments: TajweedSegment[], o: WordsOpts, keyPrefix = '') {
  return toWords(segments).map((parts, i) => {
    const n = i + 1
    return (
      <WordToken
        key={keyPrefix + n}
        parts={parts}
        mark={o.marks?.[n] ?? (o.current === n ? 'lamp' : undefined)}
        tajweed={o.tajweed}
        isolate={o.isolate}
        tabbable={o.onWord && n === (o.tabStop ?? 1)}
        onTap={o.onWord && (() => o.onWord!(n, parts.map((p) => p.text).join('')))}
      />
    )
  })
}

export interface VerseBlockProps {
  /** Plain Uthmani text, or `segments` when tajweed colours are known. */
  text?: string
  segments?: TajweedSegment[]
  /** Caption: surah name + Arabic-Indic ayah, e.g. 'العصر · ٢'. */
  reference?: string
  size?: 'inline' | 'read' | 'focus'
  /** Show tajweed colours from segments (default true). Quiz prompts pass false. */
  tajweed?: boolean
  /** 1-based inclusive word range: neutral question underline, never a tajweed hue. */
  focus?: [number, number]
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
  text = '', segments, reference, size = 'inline', tajweed = true, focus, current, marks, isolate, onWord, stopping, actions,
}: VerseBlockProps) {
  const capId = useId()
  const toks = tokens(segments ?? [{ text }], { tajweed, isolate, current, marks, onWord, tabStop: current ?? focus?.[0] })
  const body = focus
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
      <p className="verse-text" onKeyDown={onWord ? roving : undefined}>
        <span className="br" aria-hidden="true">﴿</span> {body} <span className="br" aria-hidden="true">﴾</span>
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

export interface PassageAyah { key: string; n: number; text?: string; segments?: TajweedSegment[] }

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
  return (
    <div className={`verse verse-${size} passage`} lang="ar" dir="rtl">
      <p className="verse-text" onKeyDown={onWord ? roving : undefined}>
        {ayahs.map((a, ai) => {
          const m: Record<number, WordMark> = {}
          for (const [k, v] of Object.entries(marks ?? {})) if (k.startsWith(a.key + '/')) m[+k.slice(a.key.length + 1)] = v
          const toks = tokens(a.segments ?? [{ text: a.text ?? '' }], {
            tajweed, isolate, marks: m,
            current: current?.key === a.key ? current.word : undefined,
            onWord: onWord && ((w, t) => onWord(a.key, w, t)),
            tabStop: (current ? current.key === a.key : ai === 0) ? (current?.word ?? 1) : -1,
          }, a.key + '/')
          const end = `﴿${arDigits(a.n)}﴾`
          return (
            <span key={a.key} className="ayah" data-current={currentAyah === a.key || undefined}>
              {join(toks)}{' '}
              {onAyah ? (
                <button type="button" className="ayah-end" onClick={() => onAyah(a.key)} lang="en" aria-label={`Ayah ${a.n}`}>{end}</button>
              ) : (
                <span className="ayah-end">{end}</span>
              )}{' '}
            </span>
          )
        })}
      </p>
    </div>
  )
}
