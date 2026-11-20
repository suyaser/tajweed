import { useMemo, useState, type CSSProperties } from 'react'
import type { ScreenProps } from '../app/App'
import { href } from '../app/router'
import { lessons, topics } from '../content'
import { useData } from '../core/store'
import type { Lesson } from '../core/types'
import {
  COLOUR_KEYS, CountBeats, EmptyState, Legend, LetterTiles, RuleChip, RuleRow, SegmentedControl, StarBadge, T,
} from '../components'
import { lessonStatus, type LessonStatus } from './library/shared'
import { normalize } from './library/range'
import './library.css'
import { Hint } from './study/Hint'
import { isAr, t, FWD } from '../i18n'

const ASK: Record<string, string> = { nun: t('The next letter is…'), meem: t('The next letter is…'), lam: t('The letter after ال is…') }
const GLYPH = { 'not-started': '☆', learning: '◐', known: '●', strong: '★' } as const
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
    <>
    <Hint id="rules">{t('Every rule card, the mind map and confusing pairs. Open any card any time, even before its lesson. Colours match the coloured muṣḥaf.')}</Hint>
    <div className="lib wide">
      <nav className="lib-topics" aria-label={t('Topics')}>
        {byTopic.map(({ tp, all }) => (
          <button key={tp.id} type="button" onClick={() => { setQ(''); setView('list'); goToTopic(tp.id) }}>
            <b lang="ar">{tp.nameAr}</b>
            <small>{t('{known}/{all} known', { known: all.filter((l) => isKnown(status.get(l.id)!)).length, all: all.length })}</small>
          </button>
        ))}
      </nav>
      <div className="lib-body">
      <div className="lib-tools">
        <input
          type="search" dir="auto" className="lib-search" value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value) setView('list') }}
          placeholder={t('Search · ابحث — e.g. إخفاء or مد')} aria-label={t('Search rules')}
        />
        <div className="lib-row">
          <SegmentedControl label={t('View')} value={view} onChange={setView} options={[{ value: 'list', label: t('List') }, { value: 'map', label: t('Map') }]} />
          <details className="lib-legend">
            <summary>{t('Colours')}</summary>
            <Legend colours={COLOUR_KEYS} />
          </details>
        </div>
      </div>

      {view === 'map' ? (
        <MindMap status={status} onTopic={(id) => { setView('list'); goToTopic(id) }} />
      ) : !shown.length ? (
        <EmptyState title={<T>{t('Nothing matches “{q}”.', { q })}</T>}>{t('Try the Arabic name, or a letter.')}</EmptyState>
      ) : (
        byTopic.filter((x) => x.ls.length).map(({ tp, ls }) => (
          <section key={tp.id} className="lib-sec" aria-labelledby={`topic-${tp.id}`}>
            <header className="lib-sec-head">
              <StarBadge n={tp.order + 1} size={44} />
              <div>
                <h2 id={`topic-${tp.id}`} tabIndex={-1} className="a-h3" lang="ar" dir="rtl">{tp.nameAr}</h2>
                <p className="t-sm muted"><T>{isAr ? tp.intro : `${tp.nameEn}. ${tp.intro}`}</T></p>
              </div>
            </header>
            {!nq && <Chooser topicId={tp.id} ls={ls} />}
            <div className="rrows">
              {ls.map((l) => {
                const s = status.get(l.id)!
                return <RuleRow key={l.id} nameAr={l.nameAr} nameEn={l.nameEn} colour={l.colour} level={s.level} correctionOpen={s.correction} href={href('rules', l.id)} />
              })}
            </div>
          </section>
        ))
      )}

      <nav className="rrows" aria-label={t('More')}>
        <a className="rrow" href={href('resources')}>
          <span className="stripe" aria-hidden="true" />
          <span className="rrow-main"><span className="a-lg" lang="ar">المصادر</span><span className="t-sm muted">{t('Resources and credits')}</span></span>
          <span className="chev" aria-hidden="true">{FWD}</span>
        </a>
      </nav>
      </div>
    </div>
    </>
  )
}

/** "The next letter is…" (nun/meem/lam) and the madd lengths table, collapsed to one line (design §5.6). */
function Chooser({ topicId, ls }: { topicId: string; ls: Lesson[] }) {
  if (ASK[topicId]) {
    const rows = ls.filter((l) => l.letters)
    if (!rows.length) return null
    return (
      <details className="chooser">
        <summary><T>{ASK[topicId]}</T></summary>
        {rows.map((l) => (
          <div key={l.id} className="crow">
            <LetterTiles letters={l.letters!} colour={l.colour} />
            <RuleChip nameAr={l.nameAr} colour={l.colour} href={href('rules', l.id)} />
          </div>
        ))}
      </details>
    )
  }
  if (topicId === 'madd') {
    const rows = ls.filter((l) => l.counts)
    if (!rows.length) return null
    return (
      <details className="chooser">
        <summary>{t('Lengths at a glance · solid = required, striped = allowed')}</summary>
        {rows.map((l) => (
          <div key={l.id} className="crow">
            <RuleChip nameAr={l.nameAr} colour={l.colour} href={href('rules', l.id)} />
            <CountBeats min={l.counts!.min} max={l.counts!.max} colour={l.colour} />
          </div>
        ))}
      </details>
    )
  }
  return null
}

/** Right-to-left tree (laptop) / indented list (phone). Semantically a nested list of links. */
function MindMap({ status, onTopic }: { status: Map<string, LessonStatus>; onTopic: (id: string) => void }) {
  return (
    <div className="treebox">
      <p className="t-sm muted">{!isAr && <span className="lib-map-rtl">Read it from right to left, as in a muṣḥaf. </span>}{t('Tap a topic to open its section, or a rule to open its card.')}</p>
      <div className="tree" dir="rtl" lang="ar">
        <div className="star t-root" aria-hidden="true"><span>التجويد{!isAr && <small lang="en">TAJWEED</small>}</span></div>
        <ul aria-label="التجويد">
          {topics.map((tp) => {
            const ls = lessons.filter((l) => l.topicId === tp.id)
            if (!ls.length) return null
            const known = ls.filter((l) => isKnown(status.get(l.id)!)).length
            return (
              <li key={tp.id} className="lc">
                <button type="button" className="t-cat" onClick={() => onTopic(tp.id)}>
                  <b>{tp.nameAr}</b>
                  {isAr
                    ? <small>{t('{known}/{all} known', { known, all: ls.length })}</small>
                    : <small dir="ltr" lang="en">{tp.nameEn} · {known}/{ls.length} known</small>}
                </button>
                <ul>
                  {ls.map((l) => {
                    const s = status.get(l.id)!
                    return (
                      <li key={l.id} className="ll">
                        <a className="t-leaf" href={href('rules', l.id)} style={{ '--rc': l.colour ? `var(--t-${l.colour})` : 'var(--gold)' } as CSSProperties}>
                          <b>{l.nameAr}</b>
                          <span className="level-glyph" aria-hidden="true">{GLYPH[s.level]}</span>
                          <span className="sr-only" lang={isAr ? 'ar' : 'en'}>{t(s.level.replace('-', ' '))}{s.correction ? t(', correction open') : ''}</span>

                          {s.correction && <span className="t-dot" aria-hidden="true">●</span>}
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
