import { useMemo, useState } from 'react'
import type { ScreenProps } from '../app/App'
import { href } from '../app/router'
import { lessons, topics } from '../content'
import { useData } from '../core/store'
import type { Lesson } from '../core/types'
import { COLOUR_KEYS, EmptyState, Legend, SegmentedControl, T } from '../components'
import { lessonStatus, type LessonStatus } from './library/shared'
import { normalize } from './library/range'
import { ColourDot, LevelChip, LevelMark, Letters } from './library/ui'
import { Hint } from './study/Hint'
import { digits, isAr, t } from '../i18n'
import { cn } from '@/lib/utils'
import { Chip, CountBeats, Page, PageHeader } from '@/components/kit'
import { Icon } from '@/components/ui/icon'

const ASK: Record<string, string> = { nun: t('The next letter is…'), meem: t('The next letter is…'), lam: t('The letter after ال is…') }
const isKnown = (s: LessonStatus) => s.level === 'known' || s.level === 'strong'

const haystack = (l: Lesson) => {
  const tp = topics.find((x) => x.id === l.topicId)
  return normalize([l.nameAr, l.nameEn, l.letters ?? '', l.id, tp?.nameAr ?? '', tp?.nameEn ?? ''].join(' '))
}
const HAY = new Map(lessons.map((l) => [l.id, haystack(l)]))

function goToTopic(id: string) {
  requestAnimationFrame(() => {
    const h = document.getElementById(`topic-${id}`)
    h?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    h?.focus({ preventScroll: true })
  })
}

export default function Rules(_: ScreenProps) {
  const data = useData()
  const [q, setQ] = useState('')
  const [view, setView] = useState<'list' | 'map'>('list')
  const status = useMemo(() => new Map(lessons.map((l) => [l.id, lessonStatus(data, l.id)])), [data])

  const nq = normalize(q)
  const shown = nq ? lessons.filter((l) => HAY.get(l.id)!.includes(nq)) : lessons
  const byTopic = topics.map((tp) => ({ tp, ls: shown.filter((l) => l.topicId === tp.id), all: lessons.filter((l) => l.topicId === tp.id) }))

  return (
    <Page width="wide">
      <PageHeader en="Rules" ar="أحكام التجويد" />
      <Hint id="rules">{t('Every rule card, the mind map and confusing pairs. Open any card any time, even before its lesson. Colours match the coloured muṣḥaf.')}</Hint>

      <div className="flex flex-col gap-space-md">
        <label className="relative flex items-center">
          <Icon name="search" className="pointer-events-none absolute start-4 text-on-surface-variant" />
          <input
            type="search" dir="auto" value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value) setView('list') }}
            placeholder={t('Search · ابحث — e.g. إخفاء or مد')} aria-label={t('Search rules')}
            className="h-12 w-full min-w-0 rounded-control border border-outline-variant bg-surface-container-lowest ps-12 pe-4 text-body-lg placeholder:text-on-surface-variant/70"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <SegmentedControl label={t('View')} value={view} onChange={setView}
            options={[{ value: 'list', label: t('List') }, { value: 'map', label: t('Map') }]} />
          <details className="group open:basis-full">
            <summary className="ms-auto flex h-12 w-fit cursor-pointer list-none items-center gap-1 rounded-control px-space-md text-body-md font-semibold text-primary hover:bg-surface-container [&::-webkit-details-marker]:hidden">
              <Icon name="palette" size={20} />{t('Colours')}<Icon name="expand_more" size={20} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-1 rounded-card border border-outline-variant bg-surface-container-lowest p-space-md shadow-card">
              <Legend colours={COLOUR_KEYS} />
            </div>
          </details>
        </div>
      </div>

      <div className="grid items-start gap-space-lg lg:grid-cols-[240px_1fr]">
        <nav aria-label={t('Topics')} className="-mx-gutter overflow-x-auto px-gutter md:-mx-gutter-md md:px-gutter-md lg:sticky lg:top-space-lg lg:mx-0 lg:px-0">
          <ul className="flex gap-space-sm lg:flex-col lg:gap-space-xs lg:rounded-card lg:border lg:border-outline-variant lg:bg-surface-container-lowest lg:p-space-sm">
            {byTopic.map(({ tp, all }) => {
              const known = all.filter((l) => isKnown(status.get(l.id)!)).length
              return (
                <li key={tp.id} className="shrink-0">
                  <button type="button" onClick={() => { setQ(''); setView('list'); goToTopic(tp.id) }}
                    className="flex min-h-12 w-full cursor-pointer items-center gap-space-sm rounded-control border border-outline-variant bg-surface-container-lowest px-space-md text-start transition-colors hover:bg-surface-container lg:border-transparent lg:bg-transparent">
                    <b lang="ar" className="font-arabic text-[15px] font-semibold whitespace-nowrap lg:whitespace-normal">{tp.nameAr}</b>
                    <small className="ms-auto text-caption whitespace-nowrap text-on-surface-variant">{t('{known}/{all} known', { known, all: all.length })}</small>
                  </button>
                </li>
              )
            })}
            <li className="shrink-0 lg:mt-space-xs lg:border-t lg:border-outline-variant lg:pt-space-xs">
              <a href={href('resources')} className="flex min-h-12 items-center gap-space-sm rounded-control border border-outline-variant px-space-md whitespace-nowrap text-primary no-underline hover:bg-surface-container lg:border-transparent">
                <Icon name="library_books" size={20} /><span lang="ar" className="font-arabic text-[15px]">المصادر</span>
                {!isAr && <small className="text-caption text-on-surface-variant">{t('Resources and credits')}</small>}
              </a>
            </li>
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-space-xl">
          {view === 'map' ? (
            <MindMap status={status} onTopic={(id) => { setView('list'); goToTopic(id) }} />
          ) : !shown.length ? (
            <EmptyState icon="search_off" title={<T>{t('Nothing matches “{q}”.', { q })}</T>}>{t('Try the Arabic name, or a letter.')}</EmptyState>
          ) : (
            byTopic.filter((x) => x.ls.length).map(({ tp, ls }) => (
              <section key={tp.id} className="flex flex-col gap-space-md" aria-labelledby={`topic-${tp.id}`}>
                <header className="flex items-start gap-space-md">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold bg-surface-container-lowest text-label font-bold text-secondary">{digits(tp.order + 1)}</span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <h2 id={`topic-${tp.id}`} tabIndex={-1} lang="ar" className="scroll-mt-24 font-naskh text-[22px] leading-snug font-bold text-on-surface">{tp.nameAr}</h2>
                    <p className="text-body-md text-on-surface-variant"><T>{isAr ? tp.intro : `${tp.nameEn}. ${tp.intro}`}</T></p>
                  </div>
                </header>
                {!nq && <Chooser topicId={tp.id} ls={ls} />}
                <ul className="flex flex-col divide-y divide-outline-variant overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest">
                  {ls.map((l) => {
                    const s = status.get(l.id)!
                    return (
                      <li key={l.id}>
                        <a href={href('rules', l.id)} className="flex min-h-16 items-center gap-space-md px-space-md py-space-sm text-on-surface no-underline transition-colors hover:bg-surface-container-low">
                          <ColourDot colour={l.colour} />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span lang="ar" className="font-naskh text-[19px] leading-snug font-semibold">{l.nameAr}</span>
                            {!isAr && <span className="text-body-md text-on-surface-variant">{l.nameEn}</span>}
                          </span>
                          {s.correction && <Chip tone="error" icon="flag" fill>{t('correction open')}</Chip>}
                          <LevelChip level={s.level} />
                          <Icon name="chevron_right" rtlFlip className="text-outline" />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </Page>
  )
}

const chooserSummary = 'flex min-h-12 cursor-pointer list-none items-center gap-space-sm px-space-md text-body-md font-semibold text-on-surface [&::-webkit-details-marker]:hidden'

/** "The next letter is…" (nun/meem/lam) and the madd lengths table, collapsed to one line (design §5.6). */
function Chooser({ topicId, ls }: { topicId: string; ls: Lesson[] }) {
  const rows = ASK[topicId] ? ls.filter((l) => l.letters) : topicId === 'madd' ? ls.filter((l) => l.counts) : []
  if (!rows.length) return null
  return (
    <details className="group rounded-card bg-surface-container">
      <summary className={chooserSummary}>
        <Icon name={ASK[topicId] ? 'help' : 'straighten'} size={20} className="text-secondary" />
        <span className="flex-1"><T>{ASK[topicId] ?? t('Lengths at a glance · solid = required, striped = allowed')}</T></span>
        <Icon name="expand_more" size={20} className="transition-transform group-open:rotate-180" />
      </summary>
      <ul className="flex flex-col gap-space-sm px-space-md pb-space-md">
        {rows.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-space-sm rounded-control bg-surface-container-lowest p-space-sm">
            {ASK[topicId] ? <Letters letters={l.letters!} /> : <CountBeats min={l.counts!.min} max={l.counts!.max} />}
            <a href={href('rules', l.id)} className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-space-sm no-underline hover:bg-surface-container">
              <ColourDot colour={l.colour} /><span lang="ar" className="font-arabic text-[15px] font-semibold text-on-surface">{l.nameAr}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}

/** Topics as clusters read right to left, each with its rules as leaves. Semantically a nested list of links. */
function MindMap({ status, onTopic }: { status: Map<string, LessonStatus>; onTopic: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-space-md">
      <p className="text-body-md text-on-surface-variant">{!isAr && <span>Read it from right to left, as in a muṣḥaf. </span>}{t('Tap a topic to open its section, or a rule to open its card.')}</p>
      <div dir="rtl" lang="ar" className="flex flex-col items-start gap-space-md">
        <div aria-hidden="true" className="flex items-center gap-space-sm rounded-full bg-primary px-space-lg py-space-sm text-on-primary">
          <Icon name="auto_awesome" size={20} />
          <span className="font-naskh text-[22px] font-bold">التجويد</span>
          {!isAr && <small lang="en" className="text-caption tracking-widest opacity-80">TAJWEED</small>}
        </div>
        <ul aria-label="التجويد" className="grid w-full gap-space-md border-s-2 border-gold/60 ps-space-md sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((tp) => {
            const ls = lessons.filter((l) => l.topicId === tp.id)
            if (!ls.length) return null
            const known = ls.filter((l) => isKnown(status.get(l.id)!)).length
            return (
              <li key={tp.id} className="flex flex-col gap-space-sm rounded-card border border-outline-variant bg-surface-container-lowest p-space-sm">
                <button type="button" onClick={() => onTopic(tp.id)}
                  className="flex min-h-12 cursor-pointer flex-col items-start rounded-control bg-surface-container px-space-md py-space-xs text-start hover:bg-surface-container-high">
                  <b className="font-naskh text-[18px] leading-snug">{tp.nameAr}</b>
                  {isAr
                    ? <small className="text-caption text-on-surface-variant">{t('{known}/{all} known', { known, all: ls.length })}</small>
                    : <small dir="ltr" lang="en" className="text-caption text-on-surface-variant">{tp.nameEn} · {known}/{ls.length} known</small>}
                </button>
                <ul className="flex flex-col border-s border-outline-variant ms-space-sm">
                  {ls.map((l) => {
                    const s = status.get(l.id)!
                    return (
                      <li key={l.id}>
                        <a href={href('rules', l.id)} className={cn('flex min-h-11 items-center gap-space-sm rounded-e-control ps-space-sm pe-space-xs no-underline hover:bg-surface-container-low')}>
                          <ColourDot colour={l.colour} />
                          <b className="flex-1 font-arabic text-[15px] font-medium text-on-surface">{l.nameAr}</b>
                          {s.correction && <span aria-hidden="true" className="size-2 rounded-full bg-error" />}
                          <LevelMark level={s.level} />
                          <span className="sr-only" lang={isAr ? 'ar' : 'en'}>{t(s.level.replace('-', ' '))}{s.correction ? t(', correction open') : ''}</span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
