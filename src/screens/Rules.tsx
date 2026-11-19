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

const ASK: Record<string, string> = { nun: 'The next letter is…', meem: 'The next letter is…', lam: 'The letter after ال is…' }
const GLYPH = { 'not-started': '☆', learning: '◐', known: '●', strong: '★' } as const
const isKnown = (s: LessonStatus) => s.level === 'known' || s.level === 'strong'

const haystack = (l: Lesson) => {
  const t = topics.find((x) => x.id === l.topicId)
  return normalize([l.nameAr, l.nameEn, l.letters ?? '', l.id, t?.nameAr ?? '', t?.nameEn ?? ''].join(' '))
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
  const byTopic = topics.map((t) => ({ t, ls: shown.filter((l) => l.topicId === t.id), all: lessons.filter((l) => l.topicId === t.id) }))

  return (
    <>
    <Hint id="rules">Every rule card, the mind map and confusing pairs. Open any card any time, even before its lesson. Colours match the coloured muṣḥaf.</Hint>
    <div className="lib wide">
      <nav className="lib-topics" aria-label="Topics">
        {byTopic.map(({ t, all }) => (
          <button key={t.id} type="button" onClick={() => { setQ(''); setView('list'); goToTopic(t.id) }}>
            <b lang="ar">{t.nameAr}</b>
            <small>{all.filter((l) => isKnown(status.get(l.id)!)).length}/{all.length} known</small>
          </button>
        ))}
      </nav>
      <div className="lib-body">
      <div className="lib-tools">
        <input
          type="search" dir="auto" className="lib-search" value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value) setView('list') }}
          placeholder="Search · ابحث — e.g. إخفاء or مد" aria-label="Search rules"
        />
        <div className="lib-row">
          <SegmentedControl label="View" value={view} onChange={setView} options={[{ value: 'list', label: 'List' }, { value: 'map', label: 'Map' }]} />
          <details className="lib-legend">
            <summary>Colours</summary>
            <Legend colours={COLOUR_KEYS} />
          </details>
        </div>
      </div>

      {view === 'map' ? (
        <MindMap status={status} onTopic={(id) => { setView('list'); goToTopic(id) }} />
      ) : !shown.length ? (
        <EmptyState title={<T>{`Nothing matches “${q}”.`}</T>}>Try the Arabic name, or a letter.</EmptyState>
      ) : (
        byTopic.filter((x) => x.ls.length).map(({ t, ls }) => (
          <section key={t.id} className="lib-sec" aria-labelledby={`topic-${t.id}`}>
            <header className="lib-sec-head">
              <StarBadge n={t.order + 1} size={44} />
              <div>
                <h2 id={`topic-${t.id}`} tabIndex={-1} className="a-h3" lang="ar" dir="rtl">{t.nameAr}</h2>
                <p className="t-sm muted"><T>{`${t.nameEn}. ${t.intro}`}</T></p>
              </div>
            </header>
            {!nq && <Chooser topicId={t.id} ls={ls} />}
            <div className="rrows">
              {ls.map((l) => {
                const s = status.get(l.id)!
                return <RuleRow key={l.id} nameAr={l.nameAr} nameEn={l.nameEn} colour={l.colour} level={s.level} correctionOpen={s.correction} href={href('rules', l.id)} />
              })}
            </div>
          </section>
        ))
      )}

      <nav className="rrows" aria-label="More">
        <a className="rrow" href={href('resources')}>
          <span className="stripe" aria-hidden="true" />
          <span className="rrow-main"><span className="a-lg" lang="ar">المصادر</span><span className="t-sm muted">Resources and credits</span></span>
          <span className="chev" aria-hidden="true">›</span>
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
        <summary>Lengths at a glance · solid = required, striped = allowed</summary>
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
      <p className="t-sm muted"><span className="lib-map-rtl">Read it from right to left, as in a muṣḥaf. </span>Tap a topic to open its section, or a rule to open its card.</p>
      <div className="tree" dir="rtl" lang="ar">
        <div className="star t-root" aria-hidden="true"><span>التجويد<small lang="en">TAJWEED</small></span></div>
        <ul aria-label="التجويد">
          {topics.map((t) => {
            const ls = lessons.filter((l) => l.topicId === t.id)
            if (!ls.length) return null
            return (
              <li key={t.id} className="lc">
                <button type="button" className="t-cat" onClick={() => onTopic(t.id)}>
                  <b>{t.nameAr}</b>
                  <small dir="ltr" lang="en">{t.nameEn} · {ls.filter((l) => isKnown(status.get(l.id)!)).length}/{ls.length} known</small>
                </button>
                <ul>
                  {ls.map((l) => {
                    const s = status.get(l.id)!
                    return (
                      <li key={l.id} className="ll">
                        <a className="t-leaf" href={href('rules', l.id)} style={{ '--rc': l.colour ? `var(--t-${l.colour})` : 'var(--gold)' } as CSSProperties}>
                          <b>{l.nameAr}</b>
                          <span className="level-glyph" aria-hidden="true">{GLYPH[s.level]}</span>
                          <span className="sr-only" lang="en">{s.level.replace('-', ' ')}{s.correction ? ', correction open' : ''}</span>
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
