import type { CSSProperties, ReactNode } from 'react'
import type { ColourKey } from '../core/types'
import { arDigits } from './bidi'
import { T } from './Text'
import { isAr, t, FWD } from '../i18n'

/** Muṣḥaf palette legend names (design §3.2). */
export const COLOURS: Record<ColourKey, { ar: string; en: string }> = {
  clear: { ar: 'إظهار', en: 'Clear' },
  ghunnah: { ar: 'غنة · إخفاء', en: 'Ghunnah' },
  silent: { ar: 'حرف لا يُنطق', en: 'Silent letter' },
  merge: { ar: 'إدغام', en: 'Merge' },
  madd2: { ar: 'مد حركتان', en: 'Madd 2' },
  madd45: { ar: 'مد ٤–٥', en: 'Madd 4–5' },
  madd246: { ar: 'مد ٢ أو ٤ أو ٦', en: 'Madd 2, 4 or 6' },
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
      <span aria-hidden="true" className="level-glyph">{glyph}</span> {t(word)}
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
      {level && <span className="level-glyph" aria-label={t(LEVEL[level][1])}>{LEVEL[level][0]}</span>}
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
        {!isAr && <span className="t-sm muted">{nameEn}</span>}
      </span>
      <span className="rrow-meta">
        {level && <LevelBadge level={level} />}
        {correctionOpen && <CorrectionBadge />}
      </span>
      <span className="chev" aria-hidden="true">{FWD}</span>
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
          {t('Not shown here yet:')} <span lang="ar">{notShown.join(' · ')}</span>
        </p>
      ) : null}
    </div>
  )
}

/* ---------- letters, beats ---------- */
/** Tiles for a letters string. Content may carry groups (`·`), group labels (`الهمس:`) and a gloss in brackets
 *  (`ا و ي (حروف المد)`): groups get a gap, labels and the gloss are text, never tiles (M5). Latin → plain text. */
export function LetterTiles({ letters, colour, size = 'sm' }: { letters: string | string[]; colour?: ColourKey | null; size?: 'sm' | 'option' }) {
  if (!Array.isArray(letters) && /[A-Za-z]/.test(letters)) return <span><T>{letters}</T></span>
  const raw = Array.isArray(letters) ? letters.join(' ') : letters
  const note = raw.match(/\(([^)]+)\)/)?.[1]
  const groups = raw.replace(/\([^)]*\)/g, '').split('·').map((g) => {
    const m = g.match(/^\s*([^:]+):(.*)$/)
    return { label: m?.[1].trim(), tiles: (m ? m[2] : g).split(/\s+/).filter(Boolean) }
  }).filter((g) => g.tiles.length)
  return (
    <span className={`tiles tiles-${size}`} dir="rtl" lang="ar" style={rc(colour)}>
      {groups.map((g, gi) => (
        <span key={gi} className="tile-group">
          {g.label && <span className="tile-label">{g.label}</span>}
          {g.tiles.map((l, i) => <span key={i} className={`tile${[...l.replace(/[\u064B-\u0652]/g, '')].length > 1 ? ' wide' : ''}`}>{l}</span>)}
        </span>
      ))}
      {note && <span className="tile-label">({note})</span>}
    </span>
  )
}

/** 6 squares: solid = required, striped = allowed (artifact .beats). */
export function CountBeats({ min, max = min, colour }: { min: number; max?: number; colour?: ColourKey }) {
  const label = min === max ? t('{n} counts', { n: min }) : t('{min} to {max} counts', { min, max })
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
    <span className={`ctag ctag-${severity} inline-flex min-h-7 items-center gap-1.5 rounded-full border border-on-surface px-2.5 text-label normal-case tracking-normal ${jali ? 'bg-on-surface text-surface' : 'bg-surface text-on-surface'}`}>
      <span aria-hidden="true">{jali ? '■' : '□'}</span>
      {count != null && <span className="tabular-nums">{count}</span>}
      <span lang="ar" className="text-arabic-label font-bold">{jali ? 'جلي' : 'خفي'}</span>
      {gloss && <small className="text-caption">{jali ? t('clear error') : t('fine detail')}</small>}
    </span>
  )
}

export function CorrectionBadge({ children = t('correction open') }: { children?: ReactNode }) {
  return (
    <span className="cbadge">
      <span aria-hidden="true">●</span> {children}
    </span>
  )
}

/* ---------- week dots ---------- */
export type DayMark = 'studied' | 'not' | 'future' | 'before'
const WEEK = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

/** 7 day marks (Saturday first by default), no fraction, no streak (design §5.2). */
export function ProgressDots({ days, today, labels = WEEK.map((w) => t(w)) }: { days: DayMark[]; today?: number; labels?: string[] }) {
  const n = days.filter((d) => d === 'studied').length
  return (
    <ol className="dots" aria-label={n === 1 ? t('1 day studied this week') : t('{n} days studied this week', { n })}>
      {days.map((d, i) => (
        <li key={i} data-mark={d} data-today={today === i || undefined}>
          <span className="sr-only">{`${labels[i]}: ${d === 'not' ? t('not studied') : d === 'before' ? t('before you started') : t(d)}`}</span>

        </li>
      ))}
    </ol>
  )
}
