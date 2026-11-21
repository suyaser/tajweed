// The lesson shell (docs/10 §3): header, step bar, instruction, done line, sticky bottom bar.
import { Fragment, useEffect, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Lesson } from '../../core/types'
import { courseOrder, unitOf } from '../../content/course'
import { digits, isAr, t } from '../../i18n'
import { BottomBar as KitBottomBar, PageHeader, Sep, STEP_ICONS } from '@/components/kit'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { STEP_IDS, type StepId } from './lessonSteps'

export const STEP_NAMES: Record<StepId, [string, string]> = {
  hear: ['اسمع', 'Hear'], notice: ['لاحظ', 'Notice'], learn: ['تعلّم', 'Learn'], say: ['ردّد', 'Say'],
  find: ['استخرج', 'Find'], check: ['تحقّق', 'Check'], recite: ['اقرأ', 'Recite'],
}
export const stepName = (id: StepId) => (isAr ? STEP_NAMES[id][0] : t(STEP_NAMES[id][1]))

/** Title block (the kit PageHeader, stacked): `Lesson 16 of 58 · Unit 2`, the Arabic name, the English gloss, and,
 *  outside a step (`step` false: gate and done screens), the unit's surahs and the divider. `action`: top end (Rule),
 *  on the eyebrow's row so nothing shifts between steps. */
export function LessonHeader({ lesson, action, step = false }: { lesson: Lesson; action?: ReactNode; step?: boolean }) {
  const unit = unitOf(lesson.id)
  const n = courseOrder.indexOf(lesson.id) + 1
  const where = unit && !step ? (unit.surahs && unit.surahs !== '—' ? unit.surahs : unit.nameAr) : ''
  return (
    <PageHeader stacked plain={step} en={lesson.nameEn} ar={lesson.nameAr} actions={action || undefined}
      eyebrow={n > 0 ? <>{t('Lesson {n} of {m}', { n, m: courseOrder.length })}{unit && <><Sep />{t('Unit {n}', { n: unit.n })}</>}</> : undefined}
      detail={where ? [<span lang="ar" dir="rtl" className="text-arabic-label">{where.split('، ').map((w, i) => <Fragment key={i}>{i > 0 && '، '}<bdi>{w}</bdi></Fragment>)}</span>] : undefined} />
  )
}

/** `pending`: not known yet whether the step exists for this lesson (Find, while its ayah loads). `skipped`: not in
 *  this lesson, not drawn. */
export type StepState = 'current' | 'done' | 'visited' | 'new' | 'skipped' | 'pending'

const NODE: Record<StepState, string> = {
  current: 'bg-primary-fill text-on-primary ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest',
  done: 'bg-primary-fill text-on-primary',
  visited: 'border border-dashed border-gold bg-surface-container-lowest text-secondary',
  new: 'bg-surface-container-high text-outline',
  pending: 'bg-surface-container-high text-outline',
  skipped: '',
}

/** Every step that exists is a button, backward or forward (docs/10 §3.1); steps the lesson doesn't have aren't drawn.
 *  ← / → move in visual order. */
export function StepNav({ stateOf, onGo }: { stateOf: (id: StepId) => StepState; onGo: (id: StepId) => void }) {
  const ids = STEP_IDS.filter(id => stateOf(id) !== 'skipped')
  const current = ids.find(id => stateOf(id) === 'current')
  const i = current ? ids.indexOf(current) : -1
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
    s === 'current' ? t('{x}, step {n} of {m}, current', { x: stepName(id), n: k + 1, m: ids.length })
      : s === 'done' ? t('{x}, done', { x: stepName(id) })
        : s === 'visited' ? t('{x}, visited, not finished', { x: stepName(id) })
          : t('{x}, not started', { x: stepName(id) })
  return (
    <nav aria-label={t('Lesson steps')} className="rounded-card bg-surface-container-lowest px-1 py-space-sm shadow-card">
      <ol onKeyDown={key} className="relative flex items-start justify-between">
        <span aria-hidden className="absolute inset-x-6 top-6 h-[1.5px] bg-surface-container-highest" />
        {ids.map((id, k) => {
          const s = stateOf(id)
          const node = (
            <>
              <span className={cn('relative grid size-8 place-items-center rounded-full transition-colors', NODE[s])}>
                <Icon name={s === 'done' ? 'check' : STEP_ICONS[id]} size={s === 'current' ? 18 : 16} fill={s === 'current'} />
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
              {s === 'pending' ? (
                <span className={cls} aria-label={t('{x}, not started', { x: stepName(id) })}>{node}</span>
              ) : (
                <button type="button" className={cn(cls, 'cursor-pointer hover:bg-surface-container-low')} aria-current={s === 'current' ? 'step' : undefined}
                  aria-label={label(id, k, s)} onClick={() => onGo(id)}>{node}</button>
              )}
            </li>
          )
        })}
      </ol>
      {current && <p className="sr-only">{t('Step {n} of {m} · {x}', { n: digits(i + 1), m: ids.length, x: stepName(current) })}</p>}
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
    <KitBottomBar className="mt-auto lg:w-full lg:max-w-md lg:self-end">
      {hint && <p className="text-center text-body-md text-on-surface-variant">{hint}</p>}
      {children}
    </KitBottomBar>
  )
}
