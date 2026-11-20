// The lesson shell (docs/10 §3): header, step bar, instruction, done line, sticky bottom bar.
import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Lesson } from '../../core/types'
import { courseOrder, unitOf } from '../../content/course'
import { digits, isAr, t } from '../../i18n'
import { BottomBar as KitBottomBar, STEP_ICONS } from '@/components/kit'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { STEP_IDS, type StepId } from './lessonSteps'

export const STEP_NAMES: Record<StepId, [string, string]> = {
  hear: ['اسمع', 'Hear'], notice: ['لاحظ', 'Notice'], learn: ['تعلّم', 'Learn'], say: ['ردّد', 'Say'],
  find: ['استخرج', 'Find'], check: ['تحقّق', 'Check'], recite: ['اقرأ', 'Recite'],
}
export const stepName = (id: StepId) => (isAr ? STEP_NAMES[id][0] : t(STEP_NAMES[id][1]))

/** Title block: `Lesson 16 of 58 · Unit 2`, the Arabic name, the English gloss, a small ornament. `action`: top end (Rule). */
export function LessonHeader({ lesson, action }: { lesson: Lesson; action?: ReactNode }) {
  const unit = unitOf(lesson.id)
  const n = courseOrder.indexOf(lesson.id) + 1
  const where = unit ? (unit.surahs && unit.surahs !== '—' ? unit.surahs : unit.nameAr) : ''
  return (
    <header className="flex flex-col items-center gap-1 text-center">
      {/* eyebrow at the start, the step's action (Rule) at the end: the same row on every step, so nothing shifts */}
      <div className="flex min-h-12 w-full items-center justify-between gap-space-sm">
        {n > 0 && (
          <p className="text-label font-semibold tracking-widest text-secondary uppercase rtl:tracking-normal">
            {t('Lesson {n} of {m}', { n, m: courseOrder.length })}{unit && <> · {t('Unit {n}', { n: unit.n })}</>}
          </p>
        )}
        {action}
      </div>
      <h1 className="text-arabic-headline text-on-surface" lang="ar">{lesson.nameAr}</h1>
      {!isAr && <p className="text-body-lg text-on-surface-variant">{lesson.nameEn}</p>}
      {where && <p className="text-arabic-label text-on-surface-variant" lang="ar">{where}</p>}
      <span aria-hidden className="mt-1 flex w-32 items-center gap-2 opacity-75">
        <span className="h-px flex-1 bg-gold" /><Icon name="star" size={14} className="text-gold" /><span className="h-px flex-1 bg-gold" />
      </span>
    </header>
  )
}

/** `pending`: not known yet whether the step exists for this lesson (Find, while its ayah loads). */
export type StepState = 'current' | 'done' | 'visited' | 'new' | 'skipped' | 'pending'

const NODE: Record<StepState, string> = {
  current: 'bg-primary text-on-primary ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest',
  done: 'bg-primary text-on-primary',
  visited: 'border border-dashed border-gold bg-surface-container-lowest text-secondary',
  new: 'bg-surface-container-high text-outline',
  pending: 'bg-surface-container-high text-outline',
  skipped: 'border border-dashed border-outline-variant bg-transparent text-outline',
}

/** Every step that exists is a button, backward or forward (docs/10 §3.1). ← / → move in visual order. */
export function StepNav({ stateOf, onGo }: { stateOf: (id: StepId) => StepState; onGo: (id: StepId) => void }) {
  const current = STEP_IDS.find(id => stateOf(id) === 'current')
  const i = current ? STEP_IDS.indexOf(current) : -1
  const key = (e: KeyboardEvent<HTMLOListElement>) => {
    const d = (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * (isAr ? -1 : 1)
    if (!d) return
    const bs = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
    const at = bs.indexOf(document.activeElement as HTMLButtonElement)
    if (at < 0) return
    e.preventDefault()
    bs[Math.max(0, Math.min(bs.length - 1, at + d))].focus()
  }
  const label = (id: StepId, k: number, s: StepState) =>
    s === 'current' ? t('{x}, step {n} of {m}, current', { x: stepName(id), n: k + 1, m: STEP_IDS.length })
      : s === 'done' ? t('{x}, done', { x: stepName(id) })
        : s === 'visited' ? t('{x}, visited, not finished', { x: stepName(id) })
          : t('{x}, not started', { x: stepName(id) })
  return (
    <nav aria-label={t('Lesson steps')} className="rounded-card bg-surface-container-lowest px-1 py-space-sm shadow-card">
      <ol onKeyDown={key} className="relative flex items-start justify-between">
        <span aria-hidden className="absolute inset-x-6 top-6 h-[1.5px] bg-surface-container-highest" />
        {STEP_IDS.map((id, k) => {
          const s = stateOf(id)
          const node = (
            <>
              <span className={cn('relative grid size-8 place-items-center rounded-full transition-colors', NODE[s])}>
                {s === 'skipped' ? <span className="text-label">–</span>
                  : <Icon name={s === 'done' ? 'check' : STEP_ICONS[id]} size={s === 'current' ? 18 : 16} fill={s === 'current'} />}
                {s === 'visited' && <span className="absolute -bottom-1.5 size-1 rounded-full bg-gold" />}
              </span>
              <span aria-hidden className={cn('max-w-full truncate text-caption',
                s === 'current' ? 'font-bold text-primary' : s === 'done' || s === 'visited' ? 'text-on-surface-variant' : 'text-outline')}>
                {stepName(id)}
              </span>
            </>
          )
          const cls = 'relative z-10 flex min-h-12 w-full min-w-0 flex-col items-center gap-1 rounded-control pt-2'
          return (
            <li key={id} data-state={s} className="flex min-w-0 flex-1 justify-center">
              {s === 'skipped' || s === 'pending' ? (
                <span className={cls} aria-label={s === 'pending' ? t('{x}, not started', { x: stepName(id) }) : t('{x}, not in this lesson', { x: stepName(id) })}>{node}</span>
              ) : (
                <button type="button" className={cn(cls, 'cursor-pointer hover:bg-surface-container-low')} aria-current={s === 'current' ? 'step' : undefined}
                  aria-label={label(id, k, s)} onClick={() => onGo(id)}>{node}</button>
              )}
            </li>
          )
        })}
      </ol>
      {current && <p className="sr-only">{t('Step {n} of {m} · {x}', { n: digits(i + 1), m: STEP_IDS.length, x: stepName(current) })}</p>}
    </nav>
  )
}

/** The step's one instruction line (its h2), with the step's icon. */
export function Instruction({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-space-sm rounded-card bg-surface-container-low px-space-md py-space-sm">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-container text-on-secondary-container"><Icon name={icon} size={18} /></span>
      <h2 className="min-w-0 self-center text-body-lg font-medium text-on-surface outline-none" tabIndex={-1}>{children}</h2>
    </div>
  )
}

/** "What you just did", on arrival from the previous step; gone on the first tap or key. */
export function DoneLine({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(true)
  useEffect(() => {
    const hide = () => setShown(false)
    const id = setTimeout(() => { addEventListener('pointerdown', hide, { once: true }); addEventListener('keydown', hide, { once: true }) }, 0)
    return () => { clearTimeout(id); removeEventListener('pointerdown', hide); removeEventListener('keydown', hide) }
  }, [])
  return (
    <p role="status" className={cn('flex items-start gap-space-sm rounded-card bg-success-container px-space-md py-space-sm text-body-md text-on-success-container', !shown && 'sr-only')}>
      <Icon name="check_circle" size={20} fill className="shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  )
}

/** One primary action, sticky on phone; a muted hint says what is missing while it is disabled. */
export function BottomBar({ hint, children }: { hint?: ReactNode; children: ReactNode }) {
  return (
    <KitBottomBar className="mt-auto">
      {hint && <p className="text-center text-body-md text-on-surface-variant">{hint}</p>}
      {children}
    </KitBottomBar>
  )
}
