import { useEffect, useId, useRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import type { ColourKey } from '../core/types'
import { Ornament } from './Marks'

/* ---------- buttons ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  block?: boolean
  /** Renders an <a> with button looks. */
  href?: string
}

export function Button({ variant = 'primary', block, href, className = '', type = 'button', ...rest }: ButtonProps) {
  const cls = `btn btn-${variant}${block ? ' btn-block' : ''} ${className}`
  if (href) return <a className={cls} href={href}>{rest.children}</a>
  return <button type={type} className={cls} {...rest} />
}

export type OptionState = 'idle' | 'correct' | 'wrong' | 'revealed'

/** Quiz answer: borders + glyph + word, never a red/green fill (design §5.5). */
export function OptionButton({ ar, en, state = 'idle', children, ...rest }: { ar?: string; en?: string; state?: OptionState } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const glyph = state === 'wrong' ? '↺' : state === 'idle' ? null : '✓'
  return (
    <button type="button" className="opt" data-state={state} {...rest}>
      {glyph && <span className="opt-glyph" aria-hidden="true">{glyph}</span>}
      {ar && <b lang="ar">{ar}</b>}
      {children}
      {en && <small>{en}</small>}
      {state !== 'idle' && <span className="sr-only">{state === 'wrong' ? ', not quite' : ', correct'}</span>}
    </button>
  )
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Labelled toggle chip with a text value (Loop ×3, Speed 0.75×, Gap on). */
export function ToggleChip({ label, value, pressed, onClick }: { label: string; value: string; pressed?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="tchip" aria-pressed={pressed} onClick={onClick}>
      {label} <b>{value}</b>
    </button>
  )
}

/* ---------- frames ---------- */
export function Card({ level = 'e1', stripe, eyebrow, children, className = '', as: Tag = 'section' }: {
  level?: 'e0' | 'e1' | 'e2'
  /** 5px top border in a rule colour (rule card). */
  stripe?: ColourKey
  eyebrow?: ReactNode
  children: ReactNode
  className?: string
  as?: 'section' | 'article' | 'div'
}) {
  const style = stripe ? ({ '--rc': `var(--t-${stripe})` } as CSSProperties) : undefined
  return (
    <Tag className={`card card-${level}${stripe ? ' card-stripe' : ''} ${className}`} style={style}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {children}
    </Tag>
  )
}

export function EmptyState({ title, children, action }: { title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <Ornament />
      <p className="t-lg">{title}</p>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  )
}

/** One framed line, one action, ✕ (design §6 Nudge). */
export function Nudge({ children, action, onDismiss }: { children: ReactNode; action?: ReactNode; onDismiss?: () => void }) {
  return (
    <div className="nudge card card-e1" role="note">
      <p>{children}</p>
      {action}
      {onDismiss && (
        <button type="button" className="icon-btn" onClick={onDismiss} aria-label="Dismiss">✕</button>
      )}
    </div>
  )
}

/* ---------- sheet ---------- */
/** Bottom sheet on phone, centred dialog on laptop. Native <dialog>: focus trap, Esc, focus return. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal?.()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="sheet"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={titleId}
    >
      <div className="sheet-body">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={titleId} className="t-h3">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

/* ---------- audio ---------- */
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export interface AudioTransportProps {
  playing: boolean
  loading?: boolean
  /** Text shown instead of playing, e.g. "Audio needs a connection." */
  unavailable?: string
  /** What is playing, used in labels: "Play الضحى · ٥". */
  label: string
  /** Who is speaking now: the reciter's name, or "You". */
  speaker?: string
  loop: number
  rate: number
  gap: boolean
  ayahCount?: number
  /** 0-based index into the range. */
  ayahIndex?: number
  /** Seconds left in the pause-to-repeat gap; shows "Your turn". */
  yourTurn?: number | null
  onPlayPause: () => void
  onPrev: () => void
  onNext: () => void
  onLoop: () => void
  onRate: () => void
  onGap: () => void
  onSeekAyah?: (index: number) => void
}

/** Docked player transport (design §5.7, §6, §7.5). Next ayah sits on the LEFT (RTL text); play is never mirrored. */
export function AudioTransport(p: AudioTransportProps) {
  return (
    <div className="transport" role="group" aria-label="Recitation player">
      {p.ayahCount ? (
        <div className="scrub" dir="rtl">
          {Array.from({ length: p.ayahCount }, (_, i) => (
            <button
              key={i}
              type="button"
              data-on={i <= (p.ayahIndex ?? -1) || undefined}
              aria-current={i === p.ayahIndex || undefined}
              aria-label={`Ayah ${i + 1}`}
              onClick={() => p.onSeekAyah?.(i)}
              disabled={!p.onSeekAyah}
            >
              <i />
            </button>
          ))}
        </div>
      ) : null}
      <p className="transport-status t-sm" aria-live="polite">
        {p.unavailable ??
          (p.yourTurn != null ? (
            <b className="your-turn">Your turn · <span lang="ar">ردّد</span> · {Math.ceil(p.yourTurn)}s</b>
          ) : (
            <>
              {p.speaker && <><bdi lang="ar">{p.speaker}</bdi> · </>}<bdi lang="ar">{p.label}</bdi>
            </>
          ))}
      </p>
      <div className="transport-chips">
        <ToggleChip label="Loop" value={`×${p.loop}`} pressed={p.loop > 1} onClick={p.onLoop} />
        <ToggleChip label="Speed" value={`${p.rate}×`} pressed={p.rate !== 1} onClick={p.onRate} />
        <ToggleChip label="Gap" value={p.gap ? 'on' : 'off'} pressed={p.gap} onClick={p.onGap} />
      </div>
      <div className="transport-main">
        <button type="button" className="tbtn" onClick={p.onNext} aria-label="Next ayah">
          <span aria-hidden="true">‹</span> Next
        </button>
        <button
          type="button"
          className="play"
          data-loading={p.loading || undefined}
          onClick={p.onPlayPause}
          disabled={!!p.unavailable}
          aria-label={`${p.playing ? 'Pause' : 'Play'} ${p.label}`}
        >
          <span aria-hidden="true">{p.playing ? '❚❚' : '▶'}</span>
        </button>
        <button type="button" className="tbtn" onClick={p.onPrev} aria-label="Previous ayah">
          Prev <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  )
}

export type RecordState = 'idle' | 'recording' | 'saved' | 'off'

/** 56px record circle with a text label, never icon-only (design §6). */
export function RecordButton({ state, seconds = 0, onClick, offReason }: { state: RecordState; seconds?: number; onClick: () => void; offReason?: string }) {
  if (state === 'off') return <p className="t-sm muted">{offReason ?? 'Recording is off.'}</p>
  const rec = state === 'recording'
  return (
    <div className="record">
      <button type="button" className="rec-btn" data-state={state} onClick={onClick} aria-label={rec ? 'Stop recording' : 'Record'}>
        <span aria-hidden="true" className={rec ? 'rec-stop' : 'rec-dot'} />
      </button>
      <span className="rec-label" aria-live="polite">
        {rec ? `Recording ${mmss(seconds)}` : state === 'saved' ? `Saved · ${mmss(seconds)}` : 'Record'}
      </span>
    </div>
  )
}
