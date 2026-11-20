// The lesson shell (docs/10 §3): header, step bar, done line, sticky bottom bar.
import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Lesson } from '../../core/types'
import { courseOrder, unitOf } from '../../content/course'
import { digits, isAr, t } from '../../i18n'
import { STEP_IDS, type StepId } from './lessonSteps'

export const STEP_NAMES: Record<StepId, [string, string]> = {
  hear: ['اسمع', 'Hear'], notice: ['لاحظ', 'Notice'], learn: ['تعلّم', 'Learn'], say: ['ردّد', 'Say'],
  find: ['استخرج', 'Find'], check: ['تحقّق', 'Check'], recite: ['اقرأ', 'Recite'],
}
export const stepName = (id: StepId) => (isAr ? STEP_NAMES[id][0] : t(STEP_NAMES[id][1]))

export function LessonHeader({ lesson }: { lesson: Lesson }) {
  const unit = unitOf(lesson.id)
  const n = courseOrder.indexOf(lesson.id) + 1
  const where = unit ? (unit.surahs && unit.surahs !== '—' ? unit.surahs : unit.nameAr) : ''
  return (
    <header className="s-lhead">
      <h1 className="a-h3" lang="ar">{lesson.nameAr}</h1>
      {!isAr && <p className="muted">{lesson.nameEn}</p>}
      {n > 0 && (
        <p className="t-sm muted">
          {t('Lesson {n} of {m}', { n, m: courseOrder.length })}
          {unit && <> · {t('Unit {n}', { n: unit.n })}{where && <> · <span lang="ar">{where}</span></>}</>}
        </p>
      )}
    </header>
  )
}

export type StepState = 'current' | 'done' | 'visited' | 'new' | 'skipped'

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
    <nav className="s-stepnav" aria-label={t('Lesson steps')}>
      <ol onKeyDown={key}>
        {STEP_IDS.map((id, k) => {
          const s = stateOf(id)
          const glyph = s === 'skipped' ? '–' : s === 'done' ? '✓' : digits(k + 1)
          return (
            <li key={id} data-state={s}>
              {s === 'skipped' ? (
                <span className="s-step" aria-label={t('{x}, not in this lesson', { x: stepName(id) })}>
                  <span className="s-step-star" aria-hidden="true">{glyph}</span>
                  <small aria-hidden="true">{stepName(id)}</small>
                </span>
              ) : (
                <button type="button" className="s-step" aria-current={s === 'current' ? 'step' : undefined} aria-label={label(id, k, s)} onClick={() => onGo(id)}>
                  <span className="s-step-star" aria-hidden="true">{glyph}</span>
                  <small aria-hidden="true">{stepName(id)}</small>
                </button>
              )}
            </li>
          )
        })}
      </ol>
      {current && <p className="t-sm muted" aria-hidden="true">{t('Step {n} of {m} · {x}', { n: i + 1, m: STEP_IDS.length, x: stepName(current) })}</p>}
    </nav>
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
  return <p className="s-doneline" role="status" data-hidden={!shown || undefined}><span className="s-ok" aria-hidden="true">✓ </span>{children}</p>
}

/** One primary action, sticky on phone; a muted hint says what is missing while it is disabled. */
export function BottomBar({ hint, children }: { hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="s-bottombar">
      {hint && <p className="t-sm muted s-center">{hint}</p>}
      <div className="s-bottombar-btns">{children}</div>
    </div>
  )
}
