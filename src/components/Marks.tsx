import type { CSSProperties, ReactNode } from 'react'
import type { ColourKey } from '../core/types'
import { arDigits } from './bidi'

/** Muṣḥaf palette legend names (design §3.2). */
export const COLOURS: Record<ColourKey, { ar: string; en: string }> = {
  clear: { ar: 'إظهار', en: 'Clear' },
  ghunnah: { ar: 'غنة · إخفاء', en: 'Ghunnah' },
  silent: { ar: 'حرف لا يُنطق', en: 'Silent letter' },
  merge: { ar: 'إدغام', en: 'Merge' },
  madd2: { ar: 'مد حركتان', en: 'Madd 2' },
  madd45: { ar: 'مد ٤–٥', en: 'Madd 4–5' },
  madd246: { ar: 'مد ٢·٤·٦', en: 'Madd 2·4·6' },
  madd6: { ar: 'مد ٦', en: 'Madd 6' },
  qalqalah: { ar: 'قلقلة', en: 'Qalqalah' },
  heavy: { ar: 'تفخيم', en: 'Heavy' },
  light: { ar: 'ترقيق', en: 'Light' },
}
export const COLOUR_KEYS = Object.keys(COLOURS) as ColourKey[]

const rc = (c?: ColourKey | null) => (c ? ({ '--rc': `var(--t-${c})` } as CSSProperties) : undefined)

/* ---------- level (recognition only, design §6) ---------- */
import type { Level } from '../core/scheduler'
export type { Level }
const LEVEL: Record<Level, [string, string]> = {
  'not-started': ['☆', 'not started'], learning: ['◐', 'learning'], known: ['●', 'known'], strong: ['★', 'strong'],
}

export function LevelBadge({ level, detail }: { level: Level; detail?: string }) {
  const [glyph, word] = LEVEL[level]
  return (
    <span className="level" data-level={level}>
      <span aria-hidden="true" className="level-glyph">{glyph}</span> {word}
      {detail && <span className="muted"> · {detail}</span>}
    </span>
  )
}

/* ---------- rule chip, row, legend ---------- */
export interface RuleChipProps {
  nameAr: string
  colour?: ColourKey | null
  level?: Level
  /** Isolate state; with onClick renders aria-pressed. */
  selected?: boolean
  onClick?: () => void
  href?: string
}

export function RuleChip({ nameAr, colour, level, selected, onClick, href }: RuleChipProps) {
  const inner = (
    <>
      {colour && <i className="dot" aria-hidden="true" />}
      <span lang="ar">{nameAr}</span>
      {level && <span className="level-glyph" aria-label={LEVEL[level][1]}>{LEVEL[level][0]}</span>}
    </>
  )
  const cls = `rchip${selected ? ' is-selected' : ''}`
  if (href) return <a className={cls} style={rc(colour)} href={href}>{inner}</a>
  if (onClick)
    return (
      <button type="button" className={cls} style={rc(colour)} onClick={onClick} aria-pressed={selected ?? undefined}>{inner}</button>
    )
  return <span className={cls} style={rc(colour)}>{inner}</span>
}

export interface RuleRowProps {
  nameAr: string
  nameEn: string
  colour?: ColourKey
  level?: Level
  correctionOpen?: boolean
  href: string
}

/** Library row: patterned stripe in rule colour, Arabic name in ink (legibility), gloss, badges, chevron. */
export function RuleRow({ nameAr, nameEn, colour, level, correctionOpen, href }: RuleRowProps) {
  return (
    <a className="rrow" href={href} style={rc(colour)}>
      <span className={`stripe tjp-${colour}`} aria-hidden="true" />
      <span className="rrow-main">
        <span className="a-lg" lang="ar">{nameAr}</span>
        <span className="t-sm muted">{nameEn}</span>
      </span>
      <span className="rrow-meta">
        {level && <LevelBadge level={level} />}
        {correctionOpen && <CorrectionBadge />}
      </span>
      <span className="chev" aria-hidden="true">›</span>
    </a>
  )
}

export interface LegendProps {
  colours: ColourKey[]
  isolate?: ColourKey | null
  /** Tap a chip to isolate that rule; tap again to clear (design §7.4 layer 2). */
  onIsolate?: (c: ColourKey | null) => void
  /** Rules not marked on this text yet: listed in plain ink, no dot. */
  notShown?: string[]
}

export function Legend({ colours, isolate, onIsolate, notShown }: LegendProps) {
  return (
    <div className="legend">
      <div className="legend-chips">
        {colours.map((c) => (
          <RuleChip
            key={c}
            nameAr={COLOURS[c].ar}
            colour={c}
            selected={onIsolate ? isolate === c : undefined}
            onClick={onIsolate && (() => onIsolate(isolate === c ? null : c))}
          />
        ))}
      </div>
      {notShown?.length ? (
        <p className="t-sm muted">
          Not shown here yet: <span lang="ar">{notShown.join(' · ')}</span>
        </p>
      ) : null}
    </div>
  )
}

/* ---------- letters, beats ---------- */
export function LetterTiles({ letters, colour, size = 'sm' }: { letters: string | string[]; colour?: ColourKey; size?: 'sm' | 'option' }) {
  const list = Array.isArray(letters) ? letters : letters.split(' ').filter(Boolean)
  return (
    <span className={`tiles tiles-${size}`} dir="rtl" lang="ar" style={rc(colour)}>
      {list.map((l, i) => (
        <span key={i} className={`tile${[...l].length > 2 ? ' wide' : ''}`}>{l}</span>
      ))}
    </span>
  )
}

/** 6 squares: solid = required, striped = allowed (artifact .beats). */
export function CountBeats({ min, max = min, colour }: { min: number; max?: number; colour?: ColourKey }) {
  const label = min === max ? `${min} counts` : `${min} to ${max} counts`
  return (
    <span className="beats" role="img" aria-label={label} style={rc(colour)}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <i key={i} className={i <= min ? 'on' : i <= max ? 'al' : ''} />
      ))}
    </span>
  )
}

/* ---------- star, ornament, band ---------- */
export function StarBadge({ n, size = 44, state = 'active' }: { n?: number | string; size?: 32 | 44 | 52 | 60; state?: 'locked' | 'active' | 'done' }) {
  return (
    <span className="star" data-state={state} style={{ '--s': `${size}px` } as CSSProperties} aria-hidden="true">
      <span>{state === 'done' && n == null ? '✓' : n != null ? arDigits(n) : ''}</span>
    </span>
  )
}

export function Ornament() {
  return <div className="orn" aria-hidden="true">۞</div>
}

/** Section heading with ۞, e.g. "۞ الورد · Your wird". */
export function OrnHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="orn-h">
      <span className="orn-g" aria-hidden="true">۞</span> {children}
    </h2>
  )
}

export function Band({ size = 'slim', children, className = '' }: { size?: 'slim' | 'today' | 'tall'; children?: ReactNode; className?: string }) {
  return <div className={`band band-${size} lattice ${className}`}>{children}</div>
}

/* ---------- corrections ---------- */
/** Hue-free by design: جلي = filled ink pill ■, خفي = outlined □. */
export function CorrectionTag({ severity, gloss, count }: { severity: 'jali' | 'khafi'; gloss?: boolean; count?: number }) {
  const jali = severity === 'jali'
  return (
    <span className={`ctag ctag-${severity}`}>
      <span aria-hidden="true">{jali ? '■' : '□'}</span>
      {count != null && <span className="num">{count}</span>}
      <span lang="ar">{jali ? 'جلي' : 'خفي'}</span>
      {gloss && <small>{jali ? 'clear error' : 'fine detail'}</small>}
    </span>
  )
}

export function CorrectionBadge({ children = 'correction open' }: { children?: ReactNode }) {
  return (
    <span className="cbadge">
      <span aria-hidden="true">●</span> {children}
    </span>
  )
}

/* ---------- week dots ---------- */
export type DayMark = 'studied' | 'not' | 'future'
const WEEK = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

/** 7 day marks (Saturday first by default), no fraction, no streak (design §5.2). */
export function ProgressDots({ days, today, labels = WEEK }: { days: DayMark[]; today?: number; labels?: string[] }) {
  const n = days.filter((d) => d === 'studied').length
  return (
    <ol className="dots" aria-label={`${n} ${n === 1 ? 'day' : 'days'} studied this week`}>
      {days.map((d, i) => (
        <li key={i} data-mark={d} data-today={today === i || undefined}>
          <span className="sr-only">{`${labels[i]}: ${d === 'not' ? 'not studied' : d}`}</span>
        </li>
      ))}
    </ol>
  )
}
