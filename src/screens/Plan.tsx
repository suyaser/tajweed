// #/plan: the course map (v2 spec §5). Phone: units as a vertical path, the open one shows its lessons and finale.
// Laptop: the units list beside the selected unit.
import { useState } from 'react'
import type { Unit } from '../core/types'
import { useData } from '../core/store'
import { courseProgress } from '../core/course'
import { courseOrder, units } from '../content/course'
import { href } from '../app/router'
import { Hint, PathTabs, UnitLessons, UnitNode, type UnitStatus } from './path/blocks'
import { isAr, t } from '../i18n'
import { Chip, PageHeader, StatusChip } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type P = ReturnType<typeof courseProgress>

const statusOf = (u: Unit, p: P): UnitStatus => (p.lessonsDone(u) && p.finaleDone(u) ? 'passed' : p.open(u) ? 'active' : 'locked')

/** The selected unit: name, lessons done, its lessons and finale, and the way into the unit page. */
function UnitDetail({ u, p, className }: { u: Unit; p: P; className?: string }) {
  const n = u.lessonIds.filter((id) => p.done.has(id)).length
  return (
    <div className={cn('flex flex-col gap-space-md', className)}>
      <div className="flex flex-col gap-space-xs">
        <Chip tone="gold" className="w-fit">{t('Unit {n}', { n: u.n })}</Chip>
        <p lang="ar" className="text-arabic-headline text-primary">{u.nameAr}</p>
        {!isAr && <p className="text-body-lg font-medium text-on-surface">{u.nameEn}</p>}
      </div>
      {u.lessonIds.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-label text-on-surface-variant">{t('{n} of {m} lessons done', { n, m: u.lessonIds.length })}</p>
          <Progress value={(100 * n) / u.lessonIds.length} aria-label={t('{n} of {m} lessons done', { n, m: u.lessonIds.length })} />
        </div>
      )}
      <UnitLessons u={u} p={p} />
      <Button asChild variant="tertiary" className="self-start px-0 no-underline">
        <a href={href('unit', u.id)} aria-label={t('Open unit {n}, {name}', { n: u.n, name: isAr ? u.nameAr : u.nameEn })}>
          {t('Open the unit')}<Icon name="chevron_right" size={20} rtlFlip />
        </a>
      </Button>
    </div>
  )
}

export default function Plan() {
  const d = useData()
  const p = courseProgress(d, units)
  const current = p.next.kind === 'done' ? null : p.next.unit
  const [sel, setSel] = useState<string | null>(current?.id ?? null)
  const shown = units.find((u) => u.id === sel) ?? current ?? units[0]
  const unitsDone = units.filter((u) => statusOf(u, p) === 'passed').length

  return (
    <div className="flex flex-col gap-space-lg">
      <PageHeader en="Path" ar="المسار" />
      <PathTabs value="plan" />
      <Hint id="plan">{t('The course, unit by unit. Lessons open one after another; each unit ends with a finale passage you recite, which opens the next unit.')}</Hint>
      <header className="flex flex-col gap-space-sm">
        <h2 className="flex flex-wrap items-baseline gap-x-space-sm">
          <span className={isAr ? 'text-arabic-headline text-on-surface' : 'text-headline-md text-on-surface'}>{t('Course map')}</span>
          {!isAr && <span lang="ar" className="font-naskh text-headline-md text-primary">خريطة المسار</span>}
        </h2>
        <p className="text-body-md text-on-surface-variant">
          {t('{n} of {m} lessons · {u} of {v} units done', { n: p.done.size, m: courseOrder.length, u: unitsDone, v: units.length })}
        </p>
        <Progress value={(100 * p.done.size) / courseOrder.length} aria-hidden />
      </header>

      <div className="grid items-start gap-space-lg lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-gutter-md">
        <ol className="relative flex flex-col gap-space-sm">
          <span aria-hidden className="absolute inset-y-6 start-[calc(var(--spacing-space-md)+19px)] w-px bg-outline-variant" />
          {units.map((u) => {
            const status = statusOf(u, p)
            const n = u.lessonIds.filter((id) => p.done.has(id)).length
            const open = sel === u.id
            const isShown = shown === u
            return (
              <li key={u.id} className={cn(
                'relative rounded-card border bg-surface-container-lowest',
                isShown ? 'lg:border-gold' : 'lg:border-outline-variant',
                open ? 'border-gold' : 'border-outline-variant',
                status === 'active' && 'shadow-card',
              )}>
                <button type="button" aria-expanded={open} onClick={() => setSel(open ? null : u.id)}
                  className={cn('flex w-full cursor-pointer items-center gap-space-md rounded-card p-space-md text-start', isShown && 'lg:bg-surface-container-low')}>
                  <UnitNode n={u.n} status={status} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn('text-label font-semibold tracking-wider uppercase rtl:normal-case', status === 'locked' ? 'text-outline' : 'text-secondary')}>{t('Unit {n}', { n: u.n })}</span>
                    <span lang="ar" className={cn('font-naskh text-body-lg font-semibold', status === 'locked' ? 'text-on-surface-variant' : 'text-on-surface')}>{u.nameAr}</span>
                    {!isAr && <span className="text-label text-on-surface-variant">{u.nameEn}</span>}
                    {status === 'active' && u.lessonIds.length > 0 && <Progress value={(100 * n) / u.lessonIds.length} className="mt-1.5" aria-hidden />}
                  </span>
                  {status === 'passed' ? <StatusChip status="done">{t('done')}</StatusChip>
                    : status === 'locked' ? <span className="sr-only">{t('locked')}</span>
                      : <Chip tone="gold">{u.lessonIds.length ? t('{n} of {m}', { n, m: u.lessonIds.length }) : t('finale')}</Chip>}
                  <span className="lg:hidden"><Icon name="expand_more" size={20} className={cn('text-outline transition-transform', open && 'rotate-180')} /></span>
                </button>
                {open && <UnitDetail u={u} p={p} className="border-t border-outline-variant p-space-md lg:hidden" />}
              </li>
            )
          })}
        </ol>
        <section aria-label={isAr ? shown.nameAr : shown.nameEn}
          className="sticky top-space-lg hidden rounded-card border border-outline-variant bg-surface-container-lowest p-space-lg shadow-card lg:block">
          <UnitDetail u={shown} p={p} />
        </section>
      </div>
    </div>
  )
}
