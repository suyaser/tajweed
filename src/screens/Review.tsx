// #/review: run today's queue (spec F3, design §5.4–5.5).
import { useMemo, useState } from 'react'
import type { ScreenProps } from '../app/App'
import type { ReviewItem, UserData } from '../core/types'
import { getSnapshot, markDayPart, recordAttempt, useData } from '../core/store'
import { buildQueue } from '../core/scheduler'
import { makeQuestion } from '../core/questions'
import { diffDays, today } from '../core/day'
import { getLesson, lessons, phases } from '../content'
import { href } from '../app/router'
import { Button, Card, EmptyState, T } from '../components'
import { mem, spread } from './study/helpers'
import { useStudyAudio } from './study/verse'
import { QuestionView } from './study/QuestionView'
import { CorrectionStep } from './study/CorrectionStep'
import { Summary, type Result } from './study/Summary'
import './study.css'

interface Entry { item: ReviewItem; relearn?: string } // relearn = example id to avoid

function start(d: UserData, extra: number) {
  const day = today()
  const q = buildQueue(d, lessons, phases, day, extra)
  const askable = (i: ReviewItem) =>
    i.kind === 'lesson' ? !!getLesson(i.refId)?.questionKinds.length
      : i.kind === 'correction' && d.corrections.some(c => c.id === i.refId && c.status === 'open' && !c.deletedAt)
  // ponytail: matn/contrast items (R2) and lessons without questions are left due, not asked.
  const entries: Entry[] = spread([...q.sabqi, ...q.manzil].filter(askable), i => i.kind === 'correction').map(item => ({ item }))
  return { q, entries, day }
}

const DAY_NAME = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' })

export default function Review({ params }: ScreenProps) {
  const data = useData()
  const audio = useStudyAudio()
  const [extra, setExtra] = useState(() => Number(params.more) || 0)
  const [run, setRun] = useState(() => start(getSnapshot(), extra))
  const [idx, setIdx] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [offer, setOffer] = useState(() => !!run.q.sabaq && !extra && mem().skipSabaq !== run.day)
  const { entries, day } = run
  const entry = entries[idx] as Entry | undefined
  const introduced = useMemo(() => data.introductions.map(i => i.lessonId), [data.introductions])

  const question = useMemo(() => {
    if (!entry || entry.item.kind !== 'lesson') return null
    const avoid = entry.relearn
    return makeQuestion(
      { refId: entry.item.refId, lastExampleId: avoid ?? entry.item.lastExampleId, reps: entry.item.reps },
      { lessons, introduced, munfasilLength: data.settings.munfasilLength, excludeExampleIds: avoid ? [avoid] : [] },
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
        <Card level="e2" eyebrow="Today's new lesson · السبق">
          <p className="a-h3" lang="ar">{l?.nameAr}</p>
          <p className="muted">{l?.nameEn}</p>
          {run.q.sabaqCorrected && <p className="t-sm">Your teacher corrected this. Learn it today.</p>}
          <Button block href={href('learn', run.q.sabaq)}>Start lesson</Button>
          <Button variant="ghost" block onClick={() => setOffer(false)}>{entries.length ? 'Review first' : 'Not today'}</Button>
        </Card>
      </div>
    )
  }

  // ---- empty ----
  if (!entries.length) {
    const upcoming = data.items.filter(i => !i.deletedAt && (i.state === 'sabqi' || i.state === 'manzil') && i.dueOn > day).map(i => i.dueOn).sort()[0]
    return (
      <EmptyState
        title={data.items.length ? 'Nothing due today.' : 'Nothing to review yet.'}
        action={<Button href={href('today')}>Back</Button>}
      >
        {upcoming
          ? `Your next review is ${diffDays(upcoming, day) === 1 ? 'tomorrow' : `on ${DAY_NAME(upcoming)}`}.`
          : !data.items.length ? 'Your first lesson starts it.' : null}
      </EmptyState>
    )
  }

  // ---- end summary ----
  if (!entry) {
    const more = buildQueue(data, lessons, phases, day, extra + 10)
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

  const progress = (
    <div className="s-rv-progress">
      <span className="t-sm num">{idx + 1} of {entries.length}</span>
      <div className="s-rv-bar" aria-hidden="true"><i style={{ width: `${((idx + 1) / entries.length) * 100}%` }} /></div>
    </div>
  )
  const halfway = idx === 10 && entries.length > 12
    ? <p className="t-sm muted">Halfway. You can stop here; the rest stays due.</p> : null

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

  if (!question) return <EmptyState title="This item has no question yet." action={<Button onClick={next}>Skip</Button>} />

  const it = entry.item
  const eyebrow = entry.relearn
    ? 'Once more, a different example'
    : it.state === 'sabqi'
      ? <T>{`سبقي · day ${Math.max(1, diffDays(day, it.introducedOn))}`}</T>
      : <T>{it.lastReviewedOn ? `منزل · last seen ${diffDays(day, it.lastReviewedOn)} days ago` : 'منزل'}</T>

  return (
    <>
      {progress}
      <QuestionView
        key={idx} q={question} mode={entry.relearn ? 'relearn' : 'review'} eyebrow={eyebrow} note={halfway} audio={audio}
        onNext={next}
        onAnswer={(chosen, correct) => {
          recordAttempt({
            kind: 'lesson', refId: it.refId, source: entry.relearn ? 'relearn' : 'review', questionKind: question.kind,
            exampleId: question.exampleId, chosen, correct, countsForSchedule: !entry.relearn,
          })
          if (entry.relearn) return
          setResults(r => [...r, { itemId: it.id, kind: 'lesson', refId: it.refId, correct }])
          if (!correct) setRun(r => ({ ...r, entries: [...r.entries, { item: it, relearn: question.exampleId }] }))
        }}
      />
    </>
  )
}
