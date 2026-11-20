import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { digits, t } from '@/i18n'
import { Icon } from '@/components/ui/icon'
import { Chip } from './controls'

/* ---------------- StepBar ---------------- */

export const STEP_ICONS = {
  hear: 'headphones', notice: 'visibility', learn: 'menu_book', say: 'record_voice_over', find: 'search', check: 'fact_check', recite: 'verified',
} as const
export type StepKey = keyof typeof STEP_ICONS
const STEP_LABELS: Record<StepKey, string> = { hear: 'Hear', notice: 'Notice', learn: 'Learn', say: 'Say', find: 'Find', check: 'Check', recite: 'Recite' }
export type StepState = 'current' | 'done' | 'visited' | 'not-visited' | 'skipped'

const NODE: Record<StepState, string> = {
  current: 'bg-primary text-on-primary ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest',
  done: 'bg-primary text-on-primary',
  visited: 'border border-gold bg-surface-container-lowest text-secondary',
  'not-visited': 'bg-surface-container-high text-outline',
  skipped: 'border border-dashed border-outline bg-transparent text-outline',
}
const STATE_LABEL: Record<StepState, string> = { current: 'current', done: 'done', visited: 'visited', 'not-visited': 'not started', skipped: 'skipped' }

/**
 * The 7 lesson steps as a row of 48px icon buttons on a hairline rail. `onStep` makes them navigable.
 * Done shows a check, current is filled with a ring, skipped is dashed.
 */
export function StepBar({ steps, onStep, className }: {
  steps: { key: StepKey; state: StepState; disabled?: boolean }[]; onStep?: (key: StepKey) => void; className?: string
}) {
  return (
    <nav aria-label={t('Lesson steps')} className={cn('rounded-card bg-surface-container-lowest px-space-xs py-space-sm', className)}>
      <ol className="relative flex items-start justify-between">
        <span aria-hidden className="absolute inset-x-6 top-6 h-[1.5px] bg-surface-container-highest" />
        {steps.map(({ key, state, disabled }) => {
          const label = t(STEP_LABELS[key])
          const node = (
            <>
              <span className={cn('grid size-8 place-items-center rounded-full transition-colors', NODE[state])}>
                <Icon name={state === 'done' ? 'check' : STEP_ICONS[key]} size={state === 'current' ? 18 : 16} fill={state === 'current'} />
              </span>
              <span className={cn('text-caption', state === 'current' ? 'font-bold text-primary' : state === 'not-visited' || state === 'skipped' ? 'text-outline' : 'text-on-surface-variant')}>
                {label}
              </span>
            </>
          )
          const cls = 'relative z-10 flex min-h-12 min-w-11 flex-col items-center gap-1 rounded-control pt-2'
          return (
            <li key={key} className="flex flex-1 justify-center">
              {onStep ? (
                <button type="button" disabled={disabled} onClick={() => onStep(key)} aria-current={state === 'current' ? 'step' : undefined}
                  aria-label={`${label}, ${t(STATE_LABEL[state])}`} className={cn(cls, 'cursor-pointer disabled:cursor-default')}>
                  {node}
                </button>
              ) : (
                <span className={cls} aria-current={state === 'current' ? 'step' : undefined}>{node}<span className="sr-only">, {t(STATE_LABEL[state])}</span></span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ---------------- ExampleCard ---------------- */

/** Pager dots: the current one is a wide pill. Buttons when `onPick` is given. */
export function PagerDots({ index, total, onPick }: { index: number; total: number; onPick?: (i: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const dot = <span className={cn('block h-1.5 rounded-full transition-all', i === index ? 'w-4 bg-primary' : 'w-1.5 bg-surface-container-highest')} />
        return onPick ? (
          <button key={i} type="button" onClick={() => onPick(i)} aria-label={t('Example {n}', { n: i + 1 })} aria-current={i === index || undefined}
            className="grid h-8 min-w-4 cursor-pointer place-items-center">{dot}</button>
        ) : <span key={i}>{dot}</span>
      })}
    </div>
  )
}

/**
 * One example (word or ayah) in a lesson step: eyebrow "Example 1 of 3", reference chip, big content,
 * a controls row, and prev / dots / next. Content and controls are slots.
 */
export function ExampleCard({ index, total, eyebrow, reference, children, controls, onPrev, onNext, onPick, className }: {
  index: number; total: number; reference?: ReactNode; children: ReactNode; controls?: ReactNode
  /** Replaces the "Example 1 of 3" eyebrow (e.g. "Sound A"). */
  eyebrow?: ReactNode
  onPrev?: () => void; onNext?: () => void; onPick?: (i: number) => void; className?: string
}) {
  const nav = 'grid size-12 cursor-pointer place-items-center rounded-full transition-colors hover:bg-surface-container disabled:cursor-default disabled:opacity-30'
  return (
    <article className={cn('flex flex-col gap-space-md rounded-card border border-outline-variant bg-surface-container-lowest p-space-md sm:p-space-lg', className)}>
      <header className="flex items-center justify-between gap-space-sm">
        <span className="flex items-center gap-1.5 text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          {eyebrow ?? t('Example {n} of {total}', { n: index + 1, total })}
        </span>
        {reference && <Chip icon="bookmark">{reference}</Chip>}
      </header>
      <div className="flex min-h-24 flex-col items-center justify-center py-space-sm text-center">{children}</div>
      {controls}
      {total > 1 && (
        <footer className="-mx-2 -mb-2 flex items-center justify-between border-t border-surface-container pt-1">
          <button type="button" className={cn(nav, 'text-outline')} onClick={onPrev} disabled={!onPrev || index === 0} aria-label={t('Previous example')}>
            <Icon name="chevron_left" rtlFlip />
          </button>
          <PagerDots index={index} total={total} onPick={onPick} />
          <button type="button" className={cn(nav, 'text-primary')} onClick={onNext} disabled={!onNext || index === total - 1} aria-label={t('Next example')}>
            <Icon name="chevron_right" rtlFlip />
          </button>
        </footer>
      )}
    </article>
  )
}

/* ---------------- AudioControls ---------------- */

/** Big round play (56px) between a "Played" status and Slower / Loop toggles. All state lives in the caller. */
export function AudioControls({ playing, onPlay, played, slow, onSlow, loop, onLoop, disabled, className }: {
  playing: boolean; onPlay: () => void; played?: boolean; slow?: boolean; onSlow?: () => void; loop?: boolean; onLoop?: () => void
  disabled?: boolean; className?: string
}) {
  return (
    <div className={cn('grid grid-cols-[1fr_auto_1fr] items-center gap-space-sm', className)}>
      <span className="justify-self-start">
        {played && <Chip tone="primary" icon="check_circle">{t('Played')}</Chip>}
      </span>
      <button type="button" onClick={onPlay} disabled={disabled} aria-label={t(playing ? 'Pause' : 'Play')}
        className="grid size-14 cursor-pointer place-items-center rounded-full bg-primary text-on-primary shadow-card transition-transform hover:bg-primary-hover active:scale-95 disabled:cursor-default disabled:opacity-50">
        <Icon name={playing ? 'pause' : 'play_arrow'} size={28} fill />
      </button>
      <span className="flex items-center gap-1.5 justify-self-end">
        {onSlow && <Chip icon="speed" pressed={!!slow} onClick={onSlow} label={t("Slower")}><bdi dir="ltr">0.75×</bdi></Chip>}
        {onLoop && <Chip icon="repeat" pressed={!!loop} onClick={onLoop} label={t('Loop')} />}
      </span>
    </div>
  )
}

/* ---------------- LetterTile, CountBeats ---------------- */

/** One Arabic letter with its name under it. `selected` for a picked option; `onClick` makes it a button. */
export function LetterTile({ letter, name, selected, onClick, className }: {
  letter: string; name?: ReactNode; selected?: boolean; onClick?: () => void; className?: string
}) {
  const cls = cn(
    'inline-flex min-h-16 min-w-14 flex-col items-center justify-center gap-0.5 rounded-control border px-2 py-1.5',
    selected ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant bg-surface-container-lowest text-on-surface',
    className,
  )
  const body = (
    <>
      <span lang="ar" dir="rtl" className="font-naskh text-[28px] leading-[1.3] font-semibold">{letter}</span>
      {name && <span className="text-caption text-on-surface-variant">{name}</span>}
    </>
  )
  return onClick
    ? <button type="button" aria-pressed={selected} onClick={onClick} className={cn(cls, 'cursor-pointer hover:bg-surface-container')}>{body}</button>
    : <span className={cls}>{body}</span>
}

/**
 * Numbered beats for a length in counts (ḥarakāt): 1…min solid, up to max dashed (allowed), `active` lights the
 * beat being counted. No tajweed colours.
 */
export function CountBeats({ min, max = min, active, className }: { min: number; max?: number; active?: number; className?: string }) {
  const label = min === max ? t('{n} counts', { n: min }) : t('{min} to {max} counts', { min, max })
  return (
    <span role="img" aria-label={label} className={cn('inline-flex items-center gap-1.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1
        return (
          <span key={n} className={cn(
            'grid size-8 place-items-center rounded-full text-label font-semibold transition-colors',
            n === active ? 'bg-primary text-on-primary' : n <= min ? 'bg-primary-container text-on-primary-container' : 'border border-dashed border-outline text-on-surface-variant',
          )}>{digits(n)}</span>
        )
      })}
    </span>
  )
}

/* ---------------- UnitPath ---------------- */

export type LessonDotState = 'done' | 'current' | 'todo'

/** A unit's lessons as a row of dots ending in the finale star. Dots link when `href` is set. */
export function UnitPath({ lessons, finale = 'todo', className }: {
  lessons: { state: LessonDotState; label: string; href?: string }[]; finale?: LessonDotState; className?: string
}) {
  const dot = (state: LessonDotState) => cn(
    'grid size-7 shrink-0 place-items-center rounded-full text-caption font-medium',
    state === 'done' && 'bg-primary text-on-primary',
    state === 'current' && 'bg-surface-container-lowest shadow-[0_0_0_2px_var(--color-gold)]',
    state === 'todo' && 'bg-surface-container text-outline',
  )
  return (
    <ol className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {lessons.map((l, i) => {
        const inner = l.state === 'done' ? <Icon name="check" size={16} /> : l.state === 'current' ? <span className="size-2.5 rounded-full bg-gold" /> : digits(i + 1)
        return (
          <li key={i}>
            {l.href
              ? <a href={l.href} aria-label={l.label} aria-current={l.state === 'current' ? 'step' : undefined} className="grid size-11 place-items-center rounded-full no-underline"><span className={dot(l.state)}>{inner}</span></a>
              : <span title={l.label} className={dot(l.state)}>{inner}<span className="sr-only">{l.label}</span></span>}
          </li>
        )
      })}
      <li>
        <span className={cn(dot(finale), finale === 'todo' ? 'bg-secondary-container text-secondary' : '')}>
          <Icon name="star" size={16} fill={finale === 'done'} />
          <span className="sr-only">{t('Unit finale')}</span>
        </span>
      </li>
    </ol>
  )
}
