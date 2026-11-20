// #/review: run today's queue (spec F3, design §5.4–5.5).
import { useEffect, useMemo, useState } from 'react'
import type { ScreenProps } from '../app/App'
import type { ReviewItem, UserData } from '../core/types'
import { getSnapshot, markDayPart, recordAttempt, useData } from '../core/store'
import { buildQueue } from '../core/scheduler'
import { makeQuestion, seeded, shuffle } from '../core/questions'
import { diffDays, today } from '../core/day'
import { getLesson, lessons, pairs } from '../content'
import { units } from '../content/course'
import { href } from '../app/router'
import { Button, Card, EmptyState } from '../components'
import { isAr, locale, t } from '../i18n'
import { tn, Tx } from './study/i18n'
import { confusableHint, mem, spread } from './study/helpers'
import { useStudyAudio } from './study/verse'
import { QuestionView } from './study/QuestionView'
import { CorrectionStep } from './study/CorrectionStep'
import { Summary, type Result } from './study/Summary'

/** relearn = example id to avoid; contrast = after a confusion, a two-option question between the two rules (learning M6). */
interface Entry { item: ReviewItem; relearn?: string; contrast?: { ask: string; vs: string } }

const isJali = (i: ReviewItem) => i.kind === 'correction' && i.severity === 'jali'
const topicOf = (i: ReviewItem) => (i.kind === 'correction' ? 'correction' : getLesson(i.refId)?.topicId ?? i.refId)

/**
 * Today's run: جلي corrections first, the rest shuffled (seeded by the day, so the order never names the answer,
 * learning review B1), then spread so no two corrections and no two of one topic sit back to back (M6).
 */
function start(d: UserData, extra: number) {
  const day = today()
  const q = buildQueue(d, units, day, extra)
  const askable = (i: ReviewItem) =>
    i.kind === 'lesson' ? !!getLesson(i.refId)?.questionKinds.length
      : i.kind === 'correction' && d.corrections.some(c => c.id === i.refId && c.status === 'open' && !c.deletedAt)
  // ponytail: matn/contrast items (R2) and lessons without questions are left due, not asked.
  const all = shuffle([...q.sabqi, ...q.manzil].filter(askable), seeded(Number(day.replace(/-/g, '')) + extra))
  const entries: Entry[] = spread([...all.filter(isJali), ...all.filter(i => !isJali(i))], topicOf).map(item => ({ item }))
  return { q, entries, day }
}

/* The run in progress survives leaving the screen (UX review M10): kept per tab, for today only. */
const RUN_KEY = 'tajweed-path:review-run'
interface SavedRun { day: string; extra: number; entries: Entry[]; idx: number; results: Result[] }
function loadRun(day: string): SavedRun | null {
  try {
    const r = JSON.parse(sessionStorage.getItem(RUN_KEY) ?? 'null') as SavedRun | null
    return r?.day === day ? r : null
  } catch { return null }
}
function saveRun(r: SavedRun) {
  try { sessionStorage.setItem(RUN_KEY, JSON.stringify(r)) } catch { /* storage blocked: the run restarts */ }
}

/** The example or fact asked last for this lesson, from any source (Learn checks too), so it is not asked again next. */
const lastAsked = (d: UserData, refId: string) => d.attempts.filter(a => a.kind === 'lesson' && a.refId === refId && a.exampleId).pop()?.exampleId

const DAY_NAME = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'long', timeZone: 'UTC' })

export default function Review({ params }: ScreenProps) {
  const data = useData()
  const audio = useStudyAudio()
  const [saved] = useState(() => (params.more ? null : loadRun(today())))
  const [extra, setExtra] = useState(() => saved?.extra ?? (Number(params.more) || 0))
  const [run, setRun] = useState(() => {
    const r = start(getSnapshot(), extra)
    return saved ? { ...r, entries: saved.entries } : r
  })
  const [idx, setIdx] = useState(saved?.idx ?? 0)
  const [results, setResults] = useState<Result[]>(saved?.results ?? [])
  // Today's Review button (?go=1) goes straight to the review
  const [offer, setOffer] = useState(() => !params.go && !saved && !!run.q.sabaq && !extra && mem().skipSabaq !== run.day)
  const { entries, day } = run
  useEffect(() => { saveRun({ day, extra, entries, idx, results }) }, [day, extra, entries, idx, results])
  const entry = entries[idx] as Entry | undefined
  const introduced = useMemo(() => data.introductions.map(i => i.lessonId), [data.introductions])

  const question = useMemo(() => {
    if (!entry || entry.item.kind !== 'lesson') return null
    const refId = entry.contrast?.ask ?? entry.item.refId
    const avoid = entry.relearn ?? lastAsked(getSnapshot(), refId)
    return makeQuestion(
      { refId, lastExampleId: avoid ?? entry.item.lastExampleId, reps: entry.item.reps },
      {
        lessons, introduced, munfasilLength: data.settings.munfasilLength, excludeExampleIds: entry.relearn ? [entry.relearn] : [],
        vs: entry.contrast?.vs,
      },
    )
    // a new question only when the entry changes
  }, [entry])

  const next = () => {
    audio.stop()
    if (idx + 1 >= entries.length) markDayPart('review', 'auto')
    setIdx(idx + 1)
    window.scrollTo(0, 0)
  }

  // ---- sabaq offer first (optional) ----
  if (offer && run.q.sabaq) {
    const l = getLesson(run.q.sabaq)
    return (
      <div className="s-study">
        <Card level="e2" eyebrow={isAr ? 'السبق: درس اليوم الجديد' : <>Today's new lesson · <span lang="ar">السبق</span></>}>
          <p className="a-h3" lang="ar">{l?.nameAr}</p>
          {!isAr && <p className="muted">{l?.nameEn}</p>}
          <Button block href={href('learn', run.q.sabaq)}>{t('Start lesson')}</Button>
          <Button variant="ghost" block onClick={() => setOffer(false)}>{entries.length ? t('Review first') : t('Not today')}</Button>
        </Card>
      </div>
    )
  }

  // ---- empty ----
  if (!entries.length) {
    const upcoming = data.items.filter(i => !i.deletedAt && (i.state === 'sabqi' || i.state === 'manzil') && i.dueOn > day).map(i => i.dueOn).sort()[0]
    return (
      <EmptyState
        title={data.items.length ? t('Nothing due today.') : t('Nothing to review yet.')}
        action={<Button href={href('today')}>{t('Back')}</Button>}
      >
        {upcoming
          ? (diffDays(upcoming, day) === 1 ? t('Your next review is tomorrow.') : t('Your next review is on {day}.', { day: DAY_NAME(upcoming) }))
          : !data.items.length ? t('Your first lesson starts it.') : null}
      </EmptyState>
    )
  }

  // ---- end summary ----
  if (!entry) {
    const more = buildQueue(data, units, day, extra + 10)
    const hasMore = more.sabqi.length + more.manzil.length > 0
    return (
      <Summary
        results={results} items={data.items} corrections={data.corrections} today={day}
        onMore={hasMore ? () => {
          const r = start(getSnapshot(), extra + 10)
          setExtra(extra + 10); setRun(r); setIdx(0); setResults([])
        } : undefined}
      />
    )
  }

  // re-asks are counted apart, so a miss never moves the bar backwards (m3)
  const firstAsk = (e: typeof entry) => !e.relearn && !e.contrast
  const base = entries.filter(firstAsk).length
  const n = entries.slice(0, idx + 1).filter(firstAsk).length
  const againLeft = entries.slice(idx + (firstAsk(entry) ? 1 : 0)).filter((e) => !firstAsk(e)).length
  const progress = (
    <div className="s-rv-progress">
      <span className="t-sm num">{t('{n} of {m}', { n, m: base })}{againLeft > 0 && t(' · {n} to look at again', { n: againLeft })}</span>
      <div className="s-rv-bar" aria-hidden="true"><i style={{ width: `${(n / Math.max(1, base)) * 100}%` }} /></div>
    </div>
  )
  const halfway = idx === 10 && entries.length > 12
    ? <p className="t-sm muted">{t('Halfway. You can stop here; the rest stays due.')}</p> : null

  if (entry.item.kind === 'correction') {
    const c = data.corrections.find(c => c.id === entry.item.refId)!
    return (
      <>
        {progress}
        {halfway}
        <CorrectionStep
          key={idx} c={c} audio={audio} onNext={next}
          onRate={applied => {
            recordAttempt({ kind: 'correction', refId: c.id, source: 'selfrate', chosen: applied ? 'applied' : 'not_yet', correct: applied, countsForSchedule: true })
            setResults(r => [...r, { itemId: entry.item.id, kind: 'correction', refId: c.id, correct: applied, selfRated: true }])
          }}
        />
      </>
    )
  }

  if (!question) return <EmptyState title={t('This item has no question yet.')} action={<Button onClick={next}>{t('Skip')}</Button>} />

  const it = entry.item
  const again = !!(entry.relearn || entry.contrast)
  const hint = entry.contrast && confusableHint(pairs, entry.contrast.ask, entry.contrast.vs)
  const eyebrow = entry.contrast
    ? t('Tell the two apart')
    : entry.relearn
      ? t('Once more, a different example')
      : it.state === 'sabqi'
        ? <Tx>{t('سبقي · this week')}</Tx>
        : <Tx>{it.lastReviewedOn ? tn('منزل · older · last seen {n} days ago', 'منزل · older · last seen {n} days ago', diffDays(day, it.lastReviewedOn)) : t('منزل · older')}</Tx>

  return (
    <>
      {progress}
      <QuestionView
        key={idx} q={question} mode={again ? 'relearn' : 'review'} eyebrow={eyebrow} audio={audio}
        note={<>{halfway}{hint && <Card className="s-note"><p><Tx>{hint}</Tx></p></Card>}</>}
        onNext={next}
        onAnswer={(chosen, correct) => {
          recordAttempt({
            kind: 'lesson', refId: question.lessonId, source: again ? 'relearn' : 'review', questionKind: question.kind,
            exampleId: question.exampleId, chosen, correct, countsForSchedule: !again,
          })
          if (again) return
          setResults(r => [...r, { itemId: it.id, kind: 'lesson', refId: it.refId, correct }])
          if (correct) return
          // confused with its partner: ask both ways between the two; otherwise once more on a different example
          const paired = question.kind === 'identify' && confusableHint(pairs, it.refId, chosen) !== undefined
          const more: Entry[] = paired
            ? [{ item: it, contrast: { ask: it.refId, vs: chosen } }, { item: it, contrast: { ask: chosen, vs: it.refId } }]
            : [{ item: it, relearn: question.exampleId }]
          setRun(r => ({ ...r, entries: [...r.entries, ...more] }))
        }}
      />
    </>
  )
}
