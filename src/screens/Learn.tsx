// #/learn/:lessonId: a v2 lesson (spec §3): Hear → Notice → Learn → Say → Find → Check → Recite, resumable per step.
import { useEffect, useMemo, useState } from 'react'
import type { ScreenProps } from '../app/App'
import type { Example, Lesson, Verse } from '../core/types'
import { introduceLesson, recordAttempt, useData } from '../core/store'
import { checkQuestions } from '../core/questions'
import { buildQueue, lessonGate } from '../core/scheduler'
import { today } from '../core/day'
import { drillFor, getLesson, lessons } from '../content'
import { courseLesson, unitOf, units } from '../content/course'
import { courseProgress } from '../core/course'
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

function Steps({ step, status, skip }: { step: number; status: string; skip: (s: number) => boolean }) {
  return (
    <div className="s-lsteps s-lsteps-7">
      <ol aria-label={`Step ${Math.min(step, RECITE) + 1} of ${STEPS.length}`}>
        {STEPS.map(([ar, en], i) => {
          const skipped = i !== step && skip(i) // no contrast lesson, nothing to find: a dash, not ✓
          return (
            <li key={en} aria-current={i === step || undefined}>
              <StarBadge size={32} n={skipped ? '–' : undefined} state={skipped ? 'locked' : i < step ? 'done' : i === step ? 'active' : 'locked'} />
              <span lang="ar">{ar}</span> <small>{en}{skipped && ' (skipped)'}</small>
            </li>
          )
        })}
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
  const [qs] = useState(() => checkQuestions(lesson, lessons, introducedIds.filter(id => id !== lesson.id), data.settings.munfasilLength))
  const other = course.contrastWith ? getLesson(course.contrastWith) : undefined
  const hasNotice = !!(other?.examples.length && lesson.examples.length)
  // Find skips itself when the data can't detect the rule; remembered so the step bar shows the dash
  const [noFind, setNoFind] = useState(false)
  const skip = (s: number) => (s === HEAR && !lesson.examples.length) || (s === NOTICE && !hasNotice) || (s === CHECK && !qs.length) || (s === FIND && noFind)
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

  const title = <h1 className="a-h3 s-center" lang="ar">{lesson.nameAr}</h1>
  const steps = (s: number, status: string) => <Steps step={s} status={status} skip={skip} />

  // gate: a new lesson only when it is unlocked and today's pace allows (spec §4); replays always open
  const gate = !already && step === first(HEAR) ? lessonGate(data, units, lesson.id, day) : null
  if (gate) {
    const unit = unitOf(lesson.id)
    // locked inside an open unit: name the lesson that comes first (UX minor 7)
    const firstId = gate === 'locked' && unit && courseProgress(data, units).open(unit)
      ? unit.lessonIds.slice(0, unit.lessonIds.indexOf(lesson.id)).find(id => !introducedIds.includes(id))
      : undefined
    const firstName = firstId ? getLesson(firstId)?.nameAr ?? '' : ''
    const q = buildQueue(data, units, day)
    const due = q.sabqi.length + q.manzil.length > 0 // never send them to an empty review (UX minor 8)
    return (
      <EmptyState
        title={gate === 'backlog' ? 'Review first.'
          : gate === 'pace' ? 'Come back tomorrow for this lesson.'
            : firstId ? <T>{`Finish ${firstName} first.`}</T>
              : unit ? <>This lesson opens later, in unit {unit.n} · <span lang="ar">{unit.nameAr}</span>.</> : 'This lesson is not in the course yet.'}
        action={<>
          {(gate === 'backlog' || (gate === 'pace' && due)) && <Button href={href('review') + '?go=1'}>Review</Button>}
          {firstId && <Button href={href('learn', firstId)}><T>{`Go to ${firstName}`}</T></Button>}
          <Button variant={gate === 'backlog' || (gate === 'pace' && due) || firstId ? 'secondary' : 'primary'} href={href('rules', lesson.id)}>Read the card</Button>
        </>}>
        {gate === 'backlog' ? 'More than 15 reviews are overdue. New lessons resume when you catch up.'
          : gate === 'pace' ? `Two new lessons a day is the pace that sticks. ${due ? 'Do your review today.' : 'Nothing is due: recite your recent passages from Today, or come back tomorrow.'}`
            : "Lessons open one after another. You can read the card now; reading it doesn't add it to your reviews."}
      </EmptyState>
    )
  }

  if (step === HEAR)
    return (
      <>
        {title}
        {steps(HEAR, 'Hear')}
        <Hear lesson={lesson} notice={course.notice} audio={audio} />
        <div className="s-sticky-cta"><Button block onClick={next}>Next</Button></div>
      </>
    )

  if (step === NOTICE && other)
    return (
      <>
        {title}
        {steps(NOTICE, 'Notice')}
        <Notice lesson={lesson} other={other} notice={course.notice} audio={audio} onNext={next} />
      </>
    )

  if (step === LEARN)
    return (
      <>
        {steps(LEARN, 'Learn')}
        <RuleBody lesson={lesson} audio={audio} />
        <div className="s-sticky-cta"><Button block onClick={next}>I've read it · Say it</Button></div>
      </>
    )

  if (step === SAY)
    return (
      <>
        {title}
        {steps(SAY, 'Say')}
        <Say lesson={lesson} audio={audio} onNext={next} />
      </>
    )

  if (step === FIND)
    return (
      <>
        {title}
        {steps(FIND, 'Find')}
        <Find lesson={lesson} closing={course.closing?.from} onNext={next} onNone={() => { setNoFind(true); next() }} />
      </>
    )

  if (step === CHECK && qs[qi]) {
    const cq = qs[qi]
    return (
      <>
        {title}
        {steps(CHECK, `Check · ${qi + 1} of ${qs.length}`)}
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
        {steps(RECITE, 'Recite')}
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
      {steps(DONE, 'Done')}
      <Ornament />
      <p className="t-lg"><T>{firstTime ? `${lesson.nameAr} is done. It comes back in your review tomorrow and every day this week.` : `${lesson.nameAr}: practised again.`}</T></p>
      {qs.length > 0 && <p className="num">You answered {right} of {qs.length} checks right.</p>}
      {after.sabaq && after.sabaq !== lesson.id && <Button block href={href('learn', after.sabaq)}><T>{`Next lesson: ${getLesson(after.sabaq)?.nameAr ?? ''}`}</T></Button>}
      <Button block variant={after.sabaq ? 'secondary' : 'primary'} href={href('today')}>Back to today</Button>
    </section>
  )
}

/** One example's words with ▶ (word timings, never the whole ayah). `hideText` hides the words while the audio works. */
function ExampleRow({ ex, audio, hideText = false, coloured = false }: { ex: Example; audio: StudyAudio; hideText?: boolean; coloured?: boolean }) {
  const vs = useVerse(ex.verseKey)
  const play = <PlayButton audio={audio} label={verseRef(ex.verseKey)} onClick={vs.verse && (() => audio.example(vs.verse!, ex))} />
  // by ear only while it can be heard: offline, an ayah that can't load, or a failed play shows the words (UX B2)
  const hide = hideText && !audio.offline && !vs.failed && audio.state.status !== 'error'
  return (
    <li className="s-ex-row">
      {hide ? play : <ExampleVerse ex={ex} vs={vs} spanOnly coloured={coloured} size="read" actions={play} />}
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

/**
 * Which one has the sound from Hear? By ear first, then both revealed with their names (spec §3.2). The rule's name
 * is taught in the next step, so the question describes the sound (the course `notice`), never the name (UX B2).
 */
function Notice({ lesson, other, notice, audio, onNext }: { lesson: Lesson; other: Lesson; notice: string | null; audio: StudyAudio; onNext: () => void }) {
  const pair = useMemo(() => {
    const xs = [lesson.examples[0], other.examples[0]]
    return lesson.id.length % 2 ? xs : xs.reverse() // fixed per lesson, not always first
  }, [lesson, other])
  const [picked, setPicked] = useState<number | null>(null)
  const answer = pair.findIndex(ex => ex.lessonId === lesson.id)
  return (
    <div className="s-study">
      {notice && <Card className="s-note"><p className="eyebrow">Listen for</p><p><T>{notice}</T></p></Card>}
      <p className="t-lg">{notice ? 'Listen to both. Which one has the sound described above?' : 'Listen to both. Which one sounds like the words in the last step?'}</p>
      <ol className="s-notice">
        {pair.map((ex, i) => (
          <li key={ex.id}>
            <Card level="e2">
              <p className="eyebrow">{i === 0 ? 'First' : 'Second'}{picked === i && ' · your pick'}</p>
              <ul className="s-ex-list"><ExampleRow ex={ex} audio={audio} hideText={picked === null} coloured={picked !== null} /></ul>
              {picked === null ? (
                <Button variant="secondary" onClick={() => setPicked(i)}>This one</Button>
              ) : i === answer ? (
                <p><b>Has the sound.</b> <T>{`This is ${lesson.nameAr}, the rule you learn next.`}</T></p>
              ) : (
                <p><b>Doesn't have it.</b> <T>{`This is ${other.nameAr}, an earlier rule.`}</T></p>
              )}
            </Card>
          </li>
        ))}
      </ol>
      {picked !== null && (
        <>
          <p role="status">{picked === answer ? 'Yes, you heard it.' : 'Not this time. Play both again now that you can see which is which.'}</p>
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

/**
 * Tap every word that shows the rule; checked against the tajweed data (`findTargets`). `onNone` when the data can't
 * detect the rule in any candidate ayah. Prefers an ayah where the rule is not only on the last (stop) word, where it
 * is ambiguous with المد العارض (UX M5); a tap on such a word is neutral, not wrong.
 */
function Find({ lesson, closing, onNext, onNone }: { lesson: Lesson; closing?: string; onNext: () => void; onNone: () => void }) {
  const [found, setFound] = useState<{ v: Verse; targets: number[]; neutral: number[] } | null>()
  const [picked, setPicked] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    let live = true
    const keys = [...new Set([closing, ...lesson.examples.map(e => e.verseKey)].filter((k): k is string => !!k))]
    ;(async () => {
      let fallback: { v: Verse; targets: number[]; neutral: number[] } | null = null
      for (const k of keys) {
        const v = await getVerse(k).catch(() => undefined)
        if (!v) continue
        const targets = findTargets(v, lesson.id)
        const last = v.words.length
        // stopping turns a final طبيعي into عارض: that word is a sub-case, neither right nor wrong
        const neutral = lesson.id === 'tabii' && !targets.includes(last) && findTargets(v, 'arid').includes(last) ? [last] : []
        if (!targets.length) continue
        const f = { v, targets, neutral }
        if (targets.some(n => n < last)) return live && setFound(f)
        fallback ??= f
      }
      if (live) setFound(fallback)
    })()
    return () => { live = false }
  }, [lesson.id, closing]) // eslint-disable-line react-hooks/exhaustive-deps -- lesson.examples is fixed per id
  useEffect(() => { if (found === null) onNone() }, [found]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!found) return <Skeleton verse lines={2} label="Loading the ayah…" />

  const { v, targets, neutral } = found
  const marks: Record<number, WordMark> = {}
  if (!checked) for (const n of picked) marks[n] = 'ring'
  else {
    for (const n of targets) marks[n] = picked.includes(n) ? 'found' : 'missed'
    for (const n of picked) if (!targets.includes(n) && !neutral.includes(n)) marks[n] = 'wrong'
  }
  const missed = targets.filter(n => !picked.includes(n)).length
  const extra = picked.filter(n => !targets.includes(n) && !neutral.includes(n)).length
  const toggle = (n: number) => !checked && setPicked(p => (p.includes(n) ? p.filter(x => x !== n) : [...p, n]))
  return (
    <div className="s-study s-find">
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
          {neutral.some(n => picked.includes(n)) && (
            <p className="t-sm"><T>The last word is not counted either way: stopping on it makes its مد an عارض للسكون, which you learn next.</T></p>
          )}
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
