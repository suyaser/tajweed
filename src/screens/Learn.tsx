// #/learn/:lessonId: a v2 lesson (spec §3): Hear → Notice → Learn → Say → Find → Check → Recite, resumable per step.
import { useEffect, useMemo, useState } from 'react'
import type { ScreenProps } from '../app/App'
import type { CourseLesson, Example, Lesson, Verse } from '../core/types'
import { introduceLesson, recordAttempt, useData } from '../core/store'
import { makeQuestion, type Question } from '../core/questions'
import { buildQueue } from '../core/scheduler'
import { courseProgress } from '../core/course'
import { today } from '../core/day'
import { drillFor, getLesson, lessons } from '../content'
import { courseLesson, unitOf, units } from '../content/course'
import { findTargets } from '../content/rulemap'
import { getVerse, wordSegments } from '../quran'
import { href } from '../app/router'
import { Button, Card, EmptyState, Ornament, Skeleton, StarBadge, T, VerseBlock, type TajweedSegment, type WordMark } from '../components'
import { mem, setMem, verseRef } from './study/helpers'
import { ExampleVerse, flat, PlayButton, useStudyAudio, useVerse, type StudyAudio } from './study/verse'
import { Drill } from './study/Drill'
import { QuestionView } from './study/QuestionView'
import { RuleBody } from './study/RuleBody'
import { PassageRecite, Recorder } from './study/Recorder'
import { playMe } from '../audio/compare'
import './study.css'

const STEPS = [['اسمع', 'Hear'], ['لاحظ', 'Notice'], ['تعلّم', 'Learn'], ['ردّد', 'Say'], ['استخرج', 'Find'], ['تحقّق', 'Check'], ['اقرأ', 'Recite']] as const
const [HEAR, NOTICE, LEARN, SAY, FIND, CHECK, RECITE, DONE] = [0, 1, 2, 3, 4, 5, 6, 7]

/**
 * Up to 2 check questions on different examples, plus a discrimination question (learning review B1): an example of
 * an older confusable or same-topic rule with this rule among the options, so "the one new name" is not the answer.
 */
function build(lesson: Lesson, introduced: string[], munfasilLength: 4 | 5): Question[] {
  const kind = lesson.questionKinds.includes('identify') ? 'identify' : lesson.questionKinds[0]
  const used: string[] = []
  const qs: Question[] = []
  if (kind)
    for (let i = 0; i < 2; i++) {
      const q = makeQuestion(
        { refId: lesson.id, lastExampleId: used[used.length - 1] ?? null },
        { lessons, introduced, munfasilLength, kind, excludeExampleIds: used },
      )
      if (q) { qs.push(q); used.push(q.exampleId) }
    }
  const older = (ids: string[]) => ids.find(id => introduced.includes(id) && getLesson(id)?.questionKinds.includes('identify'))
  const partner = kind === 'identify'
    ? older(lesson.confusableWith) ?? older(lessons.filter(l => l.topicId === lesson.topicId && l.id !== lesson.id).map(l => l.id))
    : undefined
  const contrast = partner && makeQuestion({ refId: partner }, { lessons, introduced: [...introduced, lesson.id], munfasilLength, kind: 'identify', include: lesson.id })
  if (contrast && contrast.options.some(o => o.id === lesson.id)) qs.push(contrast)
  return qs
}

function Steps({ step, status }: { step: number; status: string }) {
  return (
    <div className="s-lsteps s-lsteps-7">
      <ol aria-label={`Step ${Math.min(step, RECITE) + 1} of ${STEPS.length}`}>
        {STEPS.map(([ar, en], i) => (
          <li key={en} aria-current={i === step || undefined}>
            <StarBadge size={32} state={i < step ? 'done' : i === step ? 'active' : 'locked'} />
            <span lang="ar">{ar}</span> <small>{en}</small>
          </li>
        ))}
      </ol>
      <p className="t-sm muted">{status}</p>
    </div>
  )
}

export default function Learn({ params }: ScreenProps) {
  const lesson = getLesson(params.lessonId)
  return lesson ? <LessonFlow key={lesson.id} lesson={lesson} /> : (
    <EmptyState title="This lesson isn't in the library." action={<Button href={href('today')}>Back to today</Button>}>
      The link may be from an older version.
    </EmptyState>
  )
}

function LessonFlow({ lesson }: { lesson: Lesson }) {
  const data = useData()
  const audio = useStudyAudio()
  const day = today()
  const course = courseLesson(lesson.id)
  const introducedIds = data.introductions.map(i => i.lessonId)
  const already = introducedIds.includes(lesson.id)
  const [qs] = useState(() => build(lesson, introducedIds, data.settings.munfasilLength))
  const other = course.contrastWith ? getLesson(course.contrastWith) : undefined
  const hasNotice = !!(other?.examples.length && lesson.examples.length)
  const skip = (s: number) => (s === HEAR && !lesson.examples.length) || (s === NOTICE && !hasNotice) || (s === CHECK && !qs.length)
  const first = (s: number) => { while (s < DONE && skip(s)) s++; return s }
  // resume at the step left today (design §5.3 "Leaving mid-lesson")
  const [step, setStep] = useState(() => {
    const m = mem().lesson
    return m?.id === lesson.id && m.on === day ? m.step : first(HEAR)
  })
  const [qi, setQi] = useState(0)
  const [right, setRight] = useState(0)
  useEffect(() => { setMem({ lesson: step < DONE ? { id: lesson.id, on: day, step } : undefined }) }, [step, lesson.id, day])
  const go = (s: number) => { audio.stop(); setStep(first(s)); setQi(0); window.scrollTo(0, 0) }
  const next = () => go(step + 1)

  const q = buildQueue(data, units, day)
  const progress = courseProgress(data, units)
  const title = <h1 className="a-h3 s-center" lang="ar">{lesson.nameAr}</h1>

  // gate: a new lesson only when it is next in the course and today's pace allows (spec §4); replays always open
  if (!already && step === first(HEAR) && q.sabaq !== lesson.id) {
    const unit = unitOf(lesson.id)
    const isNext = progress.unlocked(lesson.id)
    return (
      <EmptyState
        title={isNext
          ? q.sabaqReason === 'backlog' ? 'Review first.' : 'Come back tomorrow for this lesson.'
          : unit ? <>This lesson opens later, in unit {unit.n} · <span lang="ar">{unit.nameAr}</span>.</> : 'This lesson is not in the course yet.'}
        action={<Button href={href('rules', lesson.id)}>Read the card</Button>}>
        {isNext
          ? q.sabaqReason === 'backlog' ? 'More than 15 reviews are overdue. New lessons resume when you catch up.' : 'Two new lessons a day is the pace that sticks. Review and practise today.'
          : "Lessons open one after another. You can read the card now; reading it doesn't add it to your reviews."}
      </EmptyState>
    )
  }

  if (step === HEAR)
    return (
      <>
        {title}
        <Steps step={HEAR} status="Hear" />
        <Hear lesson={lesson} notice={course.notice} audio={audio} />
        <div className="s-sticky-cta"><Button block onClick={next}>Next</Button></div>
      </>
    )

  if (step === NOTICE && other)
    return (
      <>
        {title}
        <Steps step={NOTICE} status="Notice" />
        <Notice lesson={lesson} other={other} audio={audio} onNext={next} />
      </>
    )

  if (step === LEARN)
    return (
      <>
        <Steps step={LEARN} status="Learn" />
        <RuleBody lesson={lesson} audio={audio} />
        <div className="s-sticky-cta"><Button block onClick={next}>I've read it · Say it</Button></div>
      </>
    )

  if (step === SAY)
    return (
      <>
        {title}
        <Steps step={SAY} status="Say" />
        <Say lesson={lesson} audio={audio} onNext={next} />
      </>
    )

  if (step === FIND)
    return (
      <>
        {title}
        <Steps step={FIND} status="Find" />
        <Find lesson={lesson} course={course} onNext={next} />
      </>
    )

  if (step === CHECK && qs[qi]) {
    const cq = qs[qi]
    return (
      <>
        {title}
        <Steps step={CHECK} status={`Check · ${qi + 1} of ${qs.length}`} />
        <QuestionView
          key={`chk${qi}`} q={cq} mode="check" audio={audio}
          onAnswer={(chosen, correct) => {
            recordAttempt({ kind: 'lesson', refId: cq.lessonId, source: 'learn', questionKind: cq.kind, exampleId: cq.exampleId, chosen, correct, countsForSchedule: false })
            if (correct) setRight(r => r + 1)
          }}
          onNext={() => (qi + 1 < qs.length ? setQi(qi + 1) : next())}
        />
      </>
    )
  }

  if (step < DONE) {
    const finish = () => { introduceLesson(lesson.id); setMem({ lesson: undefined }); go(DONE) }
    return (
      <>
        {title}
        <Steps step={RECITE} status="Recite" />
        {course.closing ? (
          <PassageRecite from={course.closing.from} to={course.closing.to} audio={audio} doneLabel="I recited it" onDone={finish} />
        ) : (
          <SayAll lesson={lesson} audio={audio} onDone={finish} />
        )}
      </>
    )
  }

  const after = buildQueue(data, units, day)
  const firstTime = data.introductions.find(i => i.lessonId === lesson.id)?.on === day
  return (
    <section className="s-study s-summary">
      <Steps step={DONE} status="Done" />
      <Ornament />
      <p className="t-lg"><T>{firstTime ? `${lesson.nameAr} is done. It comes back in your review tomorrow and every day this week.` : `${lesson.nameAr}: practised again.`}</T></p>
      {qs.length > 0 && <p className="num">You answered {right} of {qs.length} checks right.</p>}
      {after.sabaq && after.sabaq !== lesson.id && <Button block href={href('learn', after.sabaq)}><T>{`Next lesson: ${getLesson(after.sabaq)?.nameAr ?? ''}`}</T></Button>}
      <Button block variant={after.sabaq ? 'secondary' : 'primary'} href={href('today')}>Back to today</Button>
    </section>
  )
}

/** One example's words with ▶ (word timings, never the whole ayah). */
function ExampleRow({ ex, audio, hideText = false }: { ex: Example; audio: StudyAudio; hideText?: boolean }) {
  const vs = useVerse(ex.verseKey)
  const play = <PlayButton audio={audio} label={verseRef(ex.verseKey)} onClick={vs.verse && (() => audio.example(vs.verse!, ex))} />
  return (
    <li className="s-ex-row">
      {hideText ? play : <ExampleVerse ex={ex} vs={vs} spanOnly size="read" actions={play} />}
    </li>
  )
}

function Hear({ lesson, notice, audio }: { lesson: Lesson; notice: string | null; audio: StudyAudio }) {
  return (
    <div className="s-study">
      <p className="t-lg"><T>{notice ?? 'Listen to each one, as many times as you like. What do they have in common?'}</T></p>
      <ul className="s-ex-list">{lesson.examples.slice(0, 3).map(ex => <ExampleRow key={ex.id} ex={ex} audio={audio} />)}</ul>
    </div>
  )
}

/** Which one has the rule? By ear first, then both revealed (spec §3.2). */
function Notice({ lesson, other, audio, onNext }: { lesson: Lesson; other: Lesson; audio: StudyAudio; onNext: () => void }) {
  const pair = useMemo(() => {
    const xs = [lesson.examples[0], other.examples[0]]
    return lesson.id.length % 2 ? xs : xs.reverse() // fixed per lesson, not always first
  }, [lesson, other])
  const [picked, setPicked] = useState<number | null>(null)
  const answer = pair.findIndex(ex => ex.lessonId === lesson.id)
  return (
    <div className="s-study">
      <p className="t-lg"><T>{`Listen to both. Which one has ${lesson.nameAr}?`}</T></p>
      <ol className="s-notice">
        {pair.map((ex, i) => (
          <li key={ex.id}>
            <Card level="e2">
              <p className="eyebrow">{i === 0 ? 'First' : 'Second'}</p>
              <ul className="s-ex-list"><ExampleRow ex={ex} audio={audio} hideText={picked === null} /></ul>
              {picked === null ? (
                <Button variant="secondary" onClick={() => setPicked(i)}>This one</Button>
              ) : (
                <p className="t-sm"><T>{`${getLesson(ex.lessonId)?.nameAr ?? ''}${i === answer ? ' ✓' : ''}`}</T></p>
              )}
            </Card>
          </li>
        ))}
      </ol>
      {picked !== null && (
        <>
          <p role="status">{picked === answer ? 'Yes, you heard it.' : 'Not this time. Listen to both again now that you can see them.'}</p>
          <Button block onClick={onNext}>Next</Button>
        </>
      )}
    </div>
  )
}

/** Repeat after the reciter, record, compare, rate yourself; letter drills for مخارج / صفات lessons. */
function Say({ lesson, audio, onNext }: { lesson: Lesson; audio: StudyAudio; onNext: () => void }) {
  const exs = lesson.examples.slice(0, 3)
  const [i, setI] = useState(0)
  const ex = exs[i]
  const vs = useVerse(ex?.verseKey)
  if (!ex)
    return (
      <div className="s-study">
        {drillFor(lesson).length ? <Drill lesson={lesson} audio={audio} /> : <p className="t-lg">Say the examples on the card aloud, slowly.</p>}
        <Button block onClick={onNext}>Next</Button>
      </div>
    )
  const rate = (correct: boolean) => {
    recordAttempt({ kind: 'lesson', refId: lesson.id, source: 'selfrate', exampleId: ex.id, chosen: correct ? 'same' : 'not-yet', correct, countsForSchedule: false })
    audio.stop()
    i + 1 < exs.length ? setI(i + 1) : onNext()
  }
  return (
    <div className="s-study">
      <p className="t-lg">Play it, then say it the same way. Record yourself and compare.</p>
      <p className="t-sm muted num">{i + 1} of {exs.length}</p>
      <ExampleVerse ex={ex} vs={vs} spanOnly coloured size="focus"
        actions={<PlayButton audio={audio} label={verseRef(ex.verseKey)} onClick={vs.verse && (() => audio.example(vs.verse!, ex))} />} />
      {drillFor(lesson).length > 0 && i === 0 && <Drill lesson={lesson} audio={audio} />}
      <Recorder key={ex.id} from={`say:${ex.id}`} audio={audio}
        model={r => vs.verse && audio.exampleThen(vs.verse, ex, () => playMe(audio.player, r))} />
      <p>Did it sound the same?</p>
      <div className="s-part-actions" role="group" aria-label="Rate yourself">
        <Button onClick={() => rate(true)}>Same</Button>
        <Button variant="secondary" onClick={() => rate(false)}>Not yet</Button>
      </div>
    </div>
  )
}

/** Tap every word that shows the rule; checked against the tajweed data (`findTargets`). Skips itself when undetectable. */
function Find({ lesson, course, onNext }: { lesson: Lesson; course: CourseLesson; onNext: () => void }) {
  const [found, setFound] = useState<{ v: Verse; targets: number[] } | null>()
  const [picked, setPicked] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    let live = true
    const keys = [...new Set([course.closing?.from, ...lesson.examples.map(e => e.verseKey)].filter((k): k is string => !!k))]
    ;(async () => {
      for (const k of keys) {
        const v = await getVerse(k).catch(() => undefined)
        const targets = v ? findTargets(v, lesson.id) : []
        if (v && targets.length) return live && setFound({ v, targets })
      }
      if (live) setFound(null)
    })()
    return () => { live = false }
  }, [lesson, course])
  useEffect(() => { if (found === null) onNext() }, [found]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!found) return <Skeleton verse lines={2} label="Loading the ayah…" />

  const { v, targets } = found
  const marks: Record<number, WordMark> = {}
  if (!checked) for (const n of picked) marks[n] = 'ring'
  else {
    for (const n of targets) marks[n] = picked.includes(n) ? 'found' : 'missed'
    for (const n of picked) if (!targets.includes(n)) marks[n] = 'wrong'
  }
  const missed = targets.filter(n => !picked.includes(n)).length
  const extra = picked.filter(n => !targets.includes(n)).length
  const toggle = (n: number) => !checked && setPicked(p => (p.includes(n) ? p.filter(x => x !== n) : [...p, n]))
  return (
    <div className="s-study">
      <p className="t-lg"><T>{`Tap every word that has ${lesson.nameAr}.`}</T></p>
      <VerseBlock segments={flat(wordSegments(v) as TajweedSegment[][])} pauses={v.marks} verseKey={v.verseKey} reference={verseRef(v.verseKey)}
        size="focus" tajweed={checked} marks={marks} onWord={n => toggle(n)} />
      {!checked ? (
        <Button block onClick={() => setChecked(true)} disabled={!picked.length}>Check</Button>
      ) : (
        <>
          <p role="status">
            {!missed && !extra ? 'All found.' : [missed && `${missed} missed (dotted)`, extra && `${extra} without it (crossed)`].filter(Boolean).join(' · ')}
          </p>
          <p className="t-sm muted">Checked against the tajweed colours of this ayah, which can miss a rule that depends on stopping.</p>
          <Button block onClick={onNext}>Next</Button>
        </>
      )}
    </div>
  )
}

/** Recite fallback when the lesson has no closing passage yet: say the examples aloud. */
function SayAll({ lesson, audio, onDone }: { lesson: Lesson; audio: StudyAudio; onDone: () => void }) {
  return (
    <div className="s-study">
      <p className="t-lg">Say these words aloud, one after another, the way the reciter does.</p>
      {lesson.examples.length ? (
        <ul className="s-ex-list">{lesson.examples.slice(0, 5).map(ex => <ExampleRow key={ex.id} ex={ex} audio={audio} />)}</ul>
      ) : drillFor(lesson).length ? <Drill lesson={lesson} audio={audio} /> : null}
      {lesson.examples.length > 0 && <Recorder from={`say:${lesson.id}`} audio={audio} />}
      <Button block onClick={onDone}>I said them</Button>
    </div>
  )
}
