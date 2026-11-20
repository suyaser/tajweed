// Shared app controls (legacy API, rebuilt on ui/kit). Other screens import these from '../components'.
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { ColourKey } from '../core/types'
import { cn } from '@/lib/utils'
import { Button as UIButton } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Sheet as UISheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Chip, EmptyState as KitEmpty, SegmentedControl as KitSegmented } from '@/components/kit'
import { digits, isAr, t } from '../i18n'

/* ---------- buttons ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tertiary'
const VARIANT = { primary: 'primary', secondary: 'secondary', ghost: 'ghost', danger: 'destructive', tertiary: 'tertiary' } as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  block?: boolean
  /** Renders an <a> with button looks. */
  href?: string
  size?: 'default' | 'sm' | 'lg'
}

export function Button({ variant = 'primary', block, href, className, size, children, ...rest }: ButtonProps) {
  const cls = cn(block && 'w-full', className)
  if (href) return <UIButton asChild variant={VARIANT[variant]} size={size} className={cn('no-underline', cls)}><a href={href}>{children}</a></UIButton>
  return <UIButton variant={VARIANT[variant]} size={size} className={cls} {...rest}>{children}</UIButton>
}

export type OptionState = 'idle' | 'correct' | 'wrong' | 'revealed' | 'picked'

const OPT: Record<OptionState, string> = {
  idle: 'border-outline-variant hover:bg-surface-container',
  picked: 'border-gold bg-secondary-container/40',
  correct: 'border-2 border-primary bg-primary-container/50',
  revealed: 'border-2 border-dashed border-primary',
  wrong: 'border-2 border-error',
}

/** Quiz answer: borders + glyph + word, never a red/green fill (design §5.5). */
export function OptionButton({ ar, en, state = 'idle', children, className, ...rest }: { ar?: string; en?: string; state?: OptionState } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const glyph = state === 'wrong' ? 'undo' : state === 'idle' || state === 'picked' ? null : 'check'
  return (
    <button type="button" data-state={state} {...rest}
      className={cn('relative flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-control border bg-surface-container-lowest px-space-md py-space-sm text-center text-on-surface transition-colors disabled:cursor-default', OPT[state], className)}>
      {glyph && <Icon name={glyph} size={18} className={cn('absolute top-2 start-2', state === 'wrong' ? 'text-error' : 'text-primary')} />}
      {ar && <b lang="ar" className="font-naskh text-[22px] leading-[1.5] font-semibold">{ar}</b>}
      {children}
      {en && <small className="text-caption text-on-surface-variant">{en}</small>}
      {state === 'picked' && <small className="text-caption text-secondary">{t('Your guess')}</small>}
      {state !== 'idle' && state !== 'picked' && <span className="sr-only">{state === 'wrong' ? t(', not quite') : t(', correct')}</span>}
    </button>
  )
}

/** Two to four mutually exclusive options (kit SegmentedControl). */
export function SegmentedControl<V extends string>(p: { options: { value: V; label: ReactNode }[]; value: V; onChange: (v: V) => void; label: string; className?: string }) {
  return <KitSegmented {...p} />
}

/** Labelled toggle chip with a text value (Loop ×3, Speed 0.75×, Gap on). */
export function ToggleChip({ label, value, pressed, onClick, icon }: { label: string; value: string; pressed?: boolean; onClick: () => void; icon?: string }) {
  return <Chip icon={icon} pressed={!!pressed} onClick={onClick}>{label} <b className="font-semibold">{value}</b></Chip>
}

/* ---------- frames ---------- */
/** Tajweed colour classes (muṣḥaf/colours views only; legacy --t-* tokens). Static so Tailwind generates them. */
export const RULE_BG: Record<ColourKey, string> = {
  clear: 'bg-(--t-clear)', ghunnah: 'bg-(--t-ghunnah)', silent: 'bg-(--t-silent)', merge: 'bg-(--t-merge)', madd2: 'bg-(--t-madd2)',
  madd45: 'bg-(--t-madd45)', madd246: 'bg-(--t-madd246)', madd6: 'bg-(--t-madd6)', qalqalah: 'bg-(--t-qalqalah)', heavy: 'bg-(--t-heavy)', light: 'bg-(--t-light)',
}
const RULE_BORDER: Record<ColourKey, string> = {
  clear: 'border-t-(--t-clear)', ghunnah: 'border-t-(--t-ghunnah)', silent: 'border-t-(--t-silent)', merge: 'border-t-(--t-merge)', madd2: 'border-t-(--t-madd2)',
  madd45: 'border-t-(--t-madd45)', madd246: 'border-t-(--t-madd246)', madd6: 'border-t-(--t-madd6)', qalqalah: 'border-t-(--t-qalqalah)', heavy: 'border-t-(--t-heavy)', light: 'border-t-(--t-light)',
}

const eyebrowCls = 'text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case'

export function Card({ level = 'e1', stripe, eyebrow, children, className, as: Tag = 'section' }: {
  level?: 'e0' | 'e1' | 'e2'
  /** 4px top border in a rule colour (rule card). */
  stripe?: ColourKey
  eyebrow?: ReactNode
  children: ReactNode
  className?: string
  as?: 'section' | 'article' | 'div'
}) {
  return (
    <Tag className={cn(
      'flex flex-col gap-space-sm rounded-card p-space-md text-body-md text-on-surface sm:p-space-lg',
      level === 'e0' ? 'bg-surface-container' : 'border border-outline-variant bg-surface-container-lowest',
      level === 'e2' && 'shadow-card',
      stripe && cn('border-t-4', RULE_BORDER[stripe]),
      className,
    )}>
      {eyebrow && <p className={eyebrowCls}>{eyebrow}</p>}
      {children}
    </Tag>
  )
}

/** Gold uppercase label above a block. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn(eyebrowCls, className)}>{children}</p>
}

/** Placeholder lines while text loads, so a screen never flashes blank (verse-shaped: right-aligned, tall lines). */
export function Skeleton({ lines = 3, label = t('Loading…'), verse = false }: { lines?: number; label?: string; verse?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-space-sm', verse && 'items-end')} role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <i key={i} aria-hidden="true" className={cn('block animate-pulse rounded-control bg-surface-container', verse ? 'h-10' : 'h-4', i === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </div>
  )
}

export function EmptyState({ title, children, action, icon }: { title: ReactNode; children?: ReactNode; action?: ReactNode; icon?: string }) {
  return <KitEmpty icon={icon} title={title} action={action}>{children}</KitEmpty>
}

/** One framed line, one action, ✕ (design §6 Nudge). */
export function Nudge({ children, action, onDismiss }: { children: ReactNode; action?: ReactNode; onDismiss?: () => void }) {
  return (
    <div role="note" className="flex items-start gap-space-sm rounded-card border border-outline-variant bg-surface-container-lowest py-space-sm ps-space-md pe-space-xs text-body-md text-on-surface">
      <Icon name="info" size={20} className="mt-3 text-secondary" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-space-sm gap-y-space-xs py-space-xs">
        <p className="min-w-0 flex-1 basis-56 py-1.5">{children}</p>
        {action}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label={t('Dismiss')}
          className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-on-surface-variant hover:bg-surface-container">
          <Icon name="close" size={20} />
        </button>
      )}
    </div>
  )
}

/* ---------- sheet ---------- */
/** Bottom sheet (Radix dialog: focus trap, Esc, focus return). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  return (
    <UISheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent dir={isAr ? 'rtl' : 'ltr'} className="gap-space-md overflow-y-auto p-space-lg pt-space-md">
        <div aria-hidden="true" className="mx-auto h-1 w-10 shrink-0 rounded-full bg-surface-container-highest" />
        <SheetTitle className="pe-12">{title}</SheetTitle>
        <SheetDescription className="sr-only">{title}</SheetDescription>
        <div className="flex flex-col gap-space-md text-body-md">{children}</div>
      </SheetContent>
    </UISheet>
  )
}

/* ---------- list rows, fields, groups (settings-style screens) ---------- */

/** A titled group: EN label at the start with its Arabic at the end (AR UI: Arabic only), then a card of rows. */
export function Group({ en, ar, id, children, className }: { en: string; ar?: string; id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-label={isAr ? ar ?? en : en} className={cn('flex scroll-mt-20 flex-col gap-space-sm', className)}>
      <h2 className="flex items-baseline justify-between gap-space-sm px-space-xs">
        <span className="text-label font-semibold tracking-wider text-on-surface-variant uppercase rtl:normal-case">{isAr ? ar ?? en : en}</span>
        {!isAr && ar && <span lang="ar" dir="rtl" className="text-arabic-label text-secondary">{ar}</span>}
      </h2>
      <div className="flex flex-col divide-y divide-outline-variant overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest">
        {children}
      </div>
    </section>
  )
}

/** One row: icon tile, label + hint, then the control (wraps under on narrow screens). `href` makes it a link with a chevron. */
export function Row({ icon, label, hint, children, href, className, stack }: {
  icon?: string; label: ReactNode; hint?: ReactNode; children?: ReactNode; href?: string; className?: string
  /** Put the control under the label (wide controls). */
  stack?: boolean
}) {
  const head = (
    <div className={cn('flex min-w-0 flex-1 items-start gap-space-md', !stack && 'basis-60')}>
      {icon && <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-container text-on-surface-variant"><Icon name={icon} size={22} /></span>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 self-center">
        <span className="text-body-lg font-medium text-on-surface">{label}</span>
        {hint && <span className="text-body-md text-on-surface-variant">{hint}</span>}
      </div>
    </div>
  )
  const box = 'flex gap-x-space-md gap-y-space-sm p-space-md'
  if (href)
    return (
      <a href={href} className={cn(box, 'min-h-16 items-center text-on-surface no-underline transition-colors hover:bg-surface-container-low', className)}>
        {head}{children}
        <Icon name="chevron_right" rtlFlip className="text-outline" />
      </a>
    )
  return (
    <div className={cn(box, stack ? 'flex-col' : 'flex-wrap items-center', className)}>
      {head}
      {children && <div className={cn('flex flex-wrap items-center gap-space-sm', stack ? (icon ? 'sm:ps-14' : '') : 'ms-auto')}>{children}</div>}
    </div>
  )
}

const inputCls = 'h-12 w-full min-w-0 rounded-control border border-outline-variant bg-surface-container-lowest px-4 text-body-lg text-on-surface placeholder:text-on-surface-variant/70'
/** Classes for a text input / textarea / select (same look as ui Input). */
export const fieldCls = (extra?: string) => cn(inputCls, extra)

/** Label above a control, optional hint under it. */
export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-space-xs', className)}>
      <span className="text-label font-semibold text-on-surface-variant">{label}</span>
      {children}
      {hint && <span className="text-body-md text-on-surface-variant">{hint}</span>}
    </label>
  )
}

/** Inline message: role="alert" for errors, role="status" otherwise. */
export function Msg({ error, children, className }: { error?: boolean; children: ReactNode; className?: string }) {
  return <p role={error ? 'alert' : 'status'} className={cn('text-body-md', error ? 'text-error' : 'text-on-surface', className)}>{children}</p>
}

/** A row of buttons that wraps. */
export function Actions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-space-sm', className)}>{children}</div>
}

/** Confirmation panel inside a card (role alertdialog). */
export function Confirm({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="alertdialog" aria-label={label} className={cn('flex flex-col gap-space-sm rounded-control border border-error/40 bg-error-container/40 p-space-md text-body-md text-on-surface', className)}>
      {children}
    </div>
  )
}

/* ---------- audio ---------- */
const mmss = (s: number) => digits(`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`)

export interface AudioTransportProps {
  playing: boolean
  loading?: boolean
  /** Text shown instead of playing, e.g. "Audio needs a connection." */
  unavailable?: string
  /** What is playing, used in labels: "Play الضحى ٥". */
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
  /** Extra chips after Loop / Speed / Gap (e.g. Colours). */
  chips?: ReactNode
}

const tbtn = 'flex h-12 min-w-12 cursor-pointer items-center justify-center gap-1 rounded-full px-space-sm text-label font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface'

/** Docked player transport (design §5.7, §6, §7.5). Next ayah sits on the LEFT (RTL text) in both UI languages
 *  (the row is pinned LTR); play is never mirrored. */
export function AudioTransport(p: AudioTransportProps) {
  return (
    <div className="flex flex-col gap-space-md" role="group" aria-label={t('Recitation player')}>
      {p.ayahCount ? (
        <div className="flex items-center gap-1" dir="rtl">
          {Array.from({ length: p.ayahCount }, (_, i) => (
            <button key={i} type="button" aria-current={i === p.ayahIndex || undefined} aria-label={t('Ayah {n}', { n: i + 1 })}
              onClick={() => p.onSeekAyah?.(i)} disabled={!p.onSeekAyah}
              className="group flex h-6 min-w-2 flex-1 cursor-pointer items-center disabled:cursor-default">
              <i className={cn('block h-1 w-full rounded-full transition-colors', i <= (p.ayahIndex ?? -1) ? 'bg-primary' : 'bg-surface-container-highest', i === p.ayahIndex && 'h-1.5')} />
            </button>
          ))}
        </div>
      ) : null}
      <p className="min-h-6 text-center text-body-md text-on-surface-variant" aria-live="polite">
        {p.unavailable ??
          (p.yourTurn != null ? (
            <b className="font-semibold text-secondary">{t('Your turn')} · <span lang="ar">ردّد</span> · {t('{n}s', { n: Math.ceil(p.yourTurn) })}</b>
          ) : (
            <>{p.speaker && <><bdi lang="ar">{p.speaker}</bdi> · </>}<bdi lang="ar" className="text-on-surface">{p.label}</bdi></>
          ))}
      </p>
      <div className="flex items-center justify-center gap-space-lg" dir="ltr">
        <button type="button" className={tbtn} onClick={p.onNext} aria-label={t('Next ayah')}>
          <Icon name="skip_previous" />{t('Next')}
        </button>
        <button type="button" onClick={p.onPlayPause} disabled={!!p.unavailable} aria-label={`${p.playing ? t('Pause') : t('Play')} ${p.label}`}
          className={cn('grid size-16 cursor-pointer place-items-center rounded-full bg-primary text-on-primary shadow-card transition-transform hover:bg-primary-hover active:scale-95 disabled:cursor-default disabled:opacity-50', p.loading && 'animate-pulse')}>
          <Icon name={p.playing ? 'pause' : 'play_arrow'} size={32} fill />
        </button>
        <button type="button" className={tbtn} onClick={p.onPrev} aria-label={t('Previous ayah')}>
          {t('Prev')}<Icon name="skip_next" />
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-space-sm gap-y-space-md">
        <ToggleChip icon="repeat" label={t('Loop')} value={digits(`×${p.loop}`)} pressed={p.loop > 1} onClick={p.onLoop} />
        <ToggleChip icon="speed" label={t('Speed')} value={digits(`${p.rate}×`)} pressed={p.rate !== 1} onClick={p.onRate} />
        <ToggleChip icon="hourglass_empty" label={t('Gap')} value={p.gap ? t('on') : t('off')} pressed={p.gap} onClick={p.onGap} />
        {p.chips}
      </div>
    </div>
  )
}

export type RecordState = 'idle' | 'recording' | 'saved' | 'off'

/** 56px record circle with a text label, never icon-only (design §6). */
export function RecordButton({ state, seconds = 0, onClick, offReason }: { state: RecordState; seconds?: number; onClick: () => void; offReason?: string }) {
  if (state === 'off') return <p className="text-body-md text-on-surface-variant">{offReason ?? t('Recording is off.')}</p>
  const rec = state === 'recording'
  return (
    <div className="flex items-center gap-space-md">
      <button type="button" data-state={state} onClick={onClick} aria-label={rec ? t('Stop recording') : t('Record')}
        className={cn('grid size-14 shrink-0 cursor-pointer place-items-center rounded-full border-2 transition-colors',
          rec ? 'border-error bg-error text-on-error' : 'border-error/60 bg-surface-container-lowest text-error hover:bg-error-container')}>
        <Icon name={rec ? 'stop' : 'mic'} size={28} fill />
      </button>
      <span className={cn('text-body-lg font-medium', rec ? 'text-error' : 'text-on-surface')} aria-live="polite">
        {rec ? t('Recording {time}', { time: mmss(seconds) }) : state === 'saved' ? t('Saved · {time}', { time: mmss(seconds) }) : t('Record')}
      </span>
    </div>
  )
}
