// Building blocks shared by Today, the course map, Unit, Progress, Onboarding and Guide (design system, doc 13).
import { useState, type ReactNode } from 'react'
import type { Unit } from '../../core/types'
import type { courseProgress } from '../../core/course'
import type { Level } from '../../core/scheduler'
import type { DayMark } from '../../components'
import { getLesson } from '../../content'
import { href, navigate } from '../../app/router'
import { today } from '../../core/day'
import { digits, isAr, t } from '../../i18n'
import { Chip, SegmentedControl, Sep, StatusChip } from '@/components/kit'
export { Panel } from '@/components/kit'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mem, setMem } from '../study/helpers'

export function PathTabs({ value }: { value: 'plan' | 'progress' }) {
  return (
    <SegmentedControl
      label={t('Path')}
      value={value}
      onChange={(v) => navigate(v, { replace: true })}
      options={[{ value: 'plan', label: t('Plan'), icon: 'route' }, { value: 'progress', label: t('Progress'), icon: 'insights' }]}
      className="w-full sm:w-auto sm:self-start"
    />
  )
}

/** A quiet notice (tip, install, backup) with an optional action and a dismiss ✕. */
export function Note({ children, action, onDismiss, icon = 'info' }: { children: ReactNode; action?: ReactNode; onDismiss?: () => void; icon?: string }) {
  return (
    <div role="note" className="flex flex-wrap items-center gap-x-space-sm rounded-card border border-outline-variant bg-surface-container-low py-space-xs ps-space-md pe-space-xs">
      <Icon name={icon} size={20} className="shrink-0 text-secondary" />
      <p className="min-w-0 flex-1 basis-48 py-space-sm text-body-md text-on-surface">{children}</p>
      <span className="ms-auto flex items-center">
        {action}
        {onDismiss && (
          <Button variant="ghost" size="icon" onClick={onDismiss} aria-label={t('Dismiss')}><Icon name="close" size={20} /></Button>
        )}
      </span>
    </div>
  )
}

/** A one-time explanation at the top of a screen; ✕ hides it for good on this device (same memory as study/Hint). */
export function Hint({ id, children }: { id: string; children: ReactNode }) {
  const [hidden, setHidden] = useState(() => !!mem().dismissed?.[`hint:${id}`])
  if (hidden) return null
  const hide = () => { setMem({ dismissed: { ...mem().dismissed, [`hint:${id}`]: today() } }); setHidden(true) }
  return (
    <Note icon="lightbulb" onDismiss={hide} action={<Button variant="tertiary" size="sm" asChild className="no-underline"><a href={href('guide')}>{t('More')}</a></Button>}>
      {children}
    </Note>
  )
}

const WEEK = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

/** One week (Saturday first) as seven circles: studied ✓, today ringed in gold, before you started dashed. */
export function WeekDots({ days, today: ti, compact }: { days: DayMark[]; today?: number; compact?: boolean }) {
  const n = days.filter((d) => d === 'studied').length
  return (
    <ol className={cn('grid grid-cols-7 text-center', compact ? 'w-fit gap-1' : '-mx-space-sm')}
      aria-label={n === 1 ? t('1 day studied this week') : t('{n} days studied this week', { n })}>
      {days.map((d, i) => {
        const isToday = ti === i
        const label = t(WEEK[i])
        return (
          <li key={i} className="flex flex-col items-center gap-1.5">
            {!compact && <span aria-hidden className={cn('text-caption whitespace-nowrap', isToday ? 'font-bold text-secondary' : 'text-on-surface-variant')}>{label}</span>}
            <span aria-hidden className={cn(
              'grid place-items-center rounded-full',
              compact ? 'size-6' : 'size-8',
              d === 'studied' ? 'bg-primary-fill text-on-primary' : d === 'before' ? 'border border-dashed border-outline-variant' : 'bg-surface-container',
              isToday && 'ring-2 ring-gold ring-offset-2 ring-offset-surface-container-lowest',
            )}>
              {d === 'studied' ? <Icon name="check" size={compact ? 14 : 16} /> : d === 'not' && <span className="size-1 rounded-full bg-outline" />}
            </span>
            <span className="sr-only">{`${label}: ${d === 'not' ? t('not studied') : d === 'before' ? t('before you started') : t(d)}`}</span>
          </li>
        )
      })}
    </ol>
  )
}

const LEVEL: Record<Level, { tone: 'neutral' | 'gold' | 'primary' | 'success'; icon: string; label: string }> = {
  'not-started': { tone: 'neutral', icon: 'radio_button_unchecked', label: t('not started') },
  learning: { tone: 'gold', icon: 'contrast', label: t('learning') },
  known: { tone: 'primary', icon: 'check_circle', label: t('known') },
  strong: { tone: 'success', icon: 'verified', label: t('strong') },
}

/** Recognition level (quiz only), with an optional count. */
export function LevelChip({ level, detail }: { level: Level; detail?: string }) {
  const l = LEVEL[level]
  return (
    <Chip tone={l.tone} icon={l.icon} fill={level === 'strong' || level === 'known'}>
      {l.label}{detail && <><Sep className="mx-0.5" /><span className="opacity-80">{detail}</span></>}
    </Chip>
  )
}

/** جلي / خفي, with an optional count before it. */
export function SeverityChip({ severity, count }: { severity: 'jali' | 'khafi'; count?: number }) {
  const jali = severity === 'jali'
  return (
    <Chip tone={jali ? 'error' : 'outline'} icon={jali ? 'flag' : undefined} fill={jali}>
      {count != null && <span>{digits(count)}</span>}
      <span lang="ar">{jali ? 'جلي' : 'خفي'}</span>
    </Chip>
  )
}

export type UnitStatus = 'passed' | 'active' | 'locked'

/** A unit's round marker: ✓ when complete, its number (gold ring) when open, a lock when locked. */
export function UnitNode({ n, status, size = 'md' }: { n: number; status: UnitStatus; size?: 'md' | 'lg' }) {
  const lg = size === 'lg'
  return (
    <span aria-hidden className={cn(
      'grid shrink-0 place-items-center rounded-full font-semibold',
      lg ? 'size-14 text-body-lg' : 'size-10 text-body-md',
      status === 'passed' && 'bg-primary-fill text-on-primary',
      status === 'active' && 'bg-surface-container-lowest text-primary ring-2 ring-gold',
      status === 'locked' && 'bg-surface-container text-outline',
    )}>
      {status === 'passed' ? <Icon name="check" size={lg ? 28 : 20} /> : status === 'locked' ? <Icon name="lock" size={lg ? 24 : 18} /> : digits(n)}
    </span>
  )
}

type Progress = ReturnType<typeof courseProgress>
type St = 'done' | 'next' | 'catch-up' | 'locked'
const PILL: Record<St, { status: 'done' | 'current' | 'info' | 'todo'; label: string }> = {
  done: { status: 'done', label: t('done') }, next: { status: 'current', label: t('next') },
  'catch-up': { status: 'info', label: t('catch-up') }, locked: { status: 'todo', label: t('locked') },
}
const ACTION: Record<St, string> = { done: t('done, replay it'), next: t('next, start it'), 'catch-up': t('new in this version, open'), locked: t('locked') }
const ROW_ICON: Record<St, string> = { done: 'check', next: 'play_arrow', 'catch-up': 'new_releases', locked: 'lock' }

function Row({ link, ar, en, st, finale }: { link: string; ar: string; en: string; st: St; finale?: boolean }) {
  return (
    <li>
      <a href={link} aria-label={`${[en, ar].filter(Boolean).join(', ')}: ${ACTION[st]}`}
        className={cn(
          'flex min-h-14 items-center gap-space-sm rounded-control px-space-sm py-space-xs text-on-surface no-underline transition-colors hover:bg-surface-container-low',
          st === 'next' && 'bg-surface-container-low',
        )}>
        <span aria-hidden className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full',
          finale ? 'bg-secondary-container text-on-secondary-container'
            : st === 'done' ? 'bg-primary-container text-on-primary-container'
              : st === 'next' ? 'bg-primary-fill text-on-primary'
                : st === 'catch-up' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-outline',
        )}>
          <Icon name={finale ? 'star' : ROW_ICON[st]} size={18} fill={finale && st === 'done'} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span lang="ar" className={cn('font-arabic text-body-lg', st === 'locked' && 'text-on-surface-variant', st === 'next' && 'font-semibold')}>{ar}</span>
          {en && <span className="text-label text-on-surface-variant">{en}</span>}
        </span>
        <StatusChip status={PILL[st].status} className="max-sm:hidden">{PILL[st].label}</StatusChip>
      </a>
    </li>
  )
}

/** A unit's lessons (done / next / catch-up / locked) and its finale: the course map and the unit page. A locked lesson's
 *  page says what comes first and offers its card. */
export function UnitLessons({ u, p }: { u: Unit; p: Progress }) {
  const nextId = p.next.kind === 'lesson' ? p.next.id : null
  const finale: St = p.finaleDone(u) ? 'done' : p.next.kind === 'finale' && p.next.unit === u ? 'next' : 'locked'
  return (
    <ul className="-mx-space-sm flex flex-col gap-0.5">
      {u.lessonIds.map((id) => {
        const l = getLesson(id)!
        const st: St = p.done.has(id) ? 'done' : id === nextId ? 'next' : p.catchUp(id) ? 'catch-up' : 'locked'
        return <Row key={id} link={href('learn', id)} ar={l.nameAr} en={isAr ? '' : l.nameEn} st={st} />
      })}
      {u.finale && <Row finale link={href('unit', u.id) + '?finale=1'} ar={u.finale.label} en={t('Unit finale: recite the passage')} st={finale} />}
    </ul>
  )
}
