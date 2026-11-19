// #/learn/:lessonId: test-first lesson (spec F2, design §5.3): guess → card → check → apply.
import { useEffect, useState } from 'react'
import type { ScreenProps } from '../app/App'
import type { Example, Lesson } from '../core/types'
import { introduceLesson, recordAttempt, useData } from '../core/store'
import { makeQuestion, type Question } from '../core/questions'
import { today } from '../core/day'
import { drillFor, getLesson, lessons, phases } from '../content'
import { href, navigate } from '../app/router'
import { arDigits, Button, Card, EmptyState, Ornament, StarBadge, T } from '../components'
import { currentPassage, mem, rangeParam, rangeRef, setMem } from './study/helpers'
import { ExampleVerse, useStudyAudio, useVerse, type StudyAudio } from './study/verse'
import { Drill } from './study/Drill'
import { QuestionView } from './study/QuestionView'
import { RuleBody } from './study/RuleBody'
import './study.css'

const STEPS = [['جرّب', 'Guess'], ['تعلّم', 'Learn'], ['تحقّق', 'Check'], ['طبّق', 'Apply']] as const

/**
 * 2 pretest + 2 check questions, each on a different example while the pool allows (check uses unseen ones).
 * The second check is a discrimination (learning review B1): an example of an older confusable or same-topic rule,
 * with the new rule among the options, so "the one new name" is not the answer.
 */
function build(lesson: Lesson, introduced: string[], munfasilLength: 4 | 5) {
  const kind = lesson.questionKinds.includes('identify') ? 'identify' : lesson.questionKinds[0]
  const used: string[] = []
  const qs: Question[] = []
  if (kind)
    for (let i = 0; i < 4; i++) {
      const q = makeQuestion(
        { refId: lesson.id, lastExampleId: used[used.length - 1] ?? null },
        { lessons, introduced, munfasilLength, kind, pretest: i < 2, excludeExampleIds: used },
      )
      if (q) { qs.push(q); used.push(q.exampleId) }
    }
  const older = (ids: string[]) => ids.find(id => introduced.includes(id) && getLesson(id)?.questionKinds.includes('identify'))
  const partner = kind === 'identify'
    ? older(lesson.confusableWith) ?? older(lessons.filter(l => l.topicId === lesson.topicId && l.id !== lesson.id).map(l => l.id))
    : undefined
  const contrast = partner && makeQuestion({ refId: partner }, { lessons, introduced: [...introduced, lesson.id], munfasilLength, kind: 'identify', include: lesson.id })
  const check = qs.slice(2, 4)
  if (contrast && contrast.options.some(o => o.id === lesson.id)) check.splice(1, 1, contrast)
  return { pre: qs.slice(0, 2), check }
}

function Steps({ step, status }: { step: number; status: string }) {
  return (
    <div className="s-lsteps">
      <ol aria-label={`Step ${Math.min(step, 3) + 1} of 4`}>
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
  return lesson ? <LessonFlow key={lesson.id} lesson={lesson} applyOnly={!!params.apply} /> : (
    <EmptyState title="This lesson isn't in the library." action={<Button href={href('today')}>Back to today</Button>} />
  )
}

function LessonFlow({ lesson, applyOnly }: { lesson: Lesson; applyOnly: boolean }) {
  const data = useData()
  const audio = useStudyAudio()
  const day = today()
  const introducedIds = data.introductions.map(i => i.lessonId)
  const already = introducedIds.includes(lesson.id)
  const [qs] = useState(() => build(lesson, introducedIds, data.settings.munfasilLength))
  // resume at the step left today (design §5.3 "Leaving mid-lesson")
  const [step, setStep] = useState(() => {
    if (applyOnly && already) return 3 // "say it again" from Today
    const m = mem().lesson
    return m?.id === lesson.id && m.on === day ? m.step : qs.pre.length ? 0 : 1
  })
  const [qi, setQi] = useState(0)
  const [right, setRight] = useState(0)
  useEffect(() => { setMem({ lesson: step < 4 ? { id: lesson.id, on: day, step } : undefined }) }, [step, lesson.id, day])

  const applyEx = qs.check.find(q => q.lessonId === lesson.id)?.example ?? lesson.examples[0]
  const go = (s: number) => { audio.stop(); setStep(s); setQi(0); window.scrollTo(0, 0) }
  const finishCheck = () => { introduceLesson(lesson.id); go(3) } // Apply always follows (UX review M12)

  const phase = data.phases.find(p => p.id === lesson.phaseId)
  if (!already && phase?.status !== 'active' && step === 0)
    return (
      <EmptyState title={<>You'll learn this in phase <span lang="ar">{arDigits(lesson.phaseId)}</span>.</>}
        action={<Button href={href('rules', lesson.id)}>Read the card</Button>}>
        Reading the card doesn't add it to your reviews; the lesson does, when its phase starts.
      </EmptyState>
    )

  const title = <h1 className="a-h3 s-center" lang="ar">{lesson.nameAr}</h1>

  if (step === 0 && qs.pre[qi]) {
    const q = qs.pre[qi]
    return (
      <>
        {title}
        <Steps step={0} status={`Guess · ${qi + 1} of ${qs.pre.length}`} />
        <QuestionView
          key={`pre${qi}`} q={q} mode="pretest" audio={audio}
          note={qi === 0 ? <Card className="s-note"><p>You haven't learned this yet. Guess. Guessing first helps you remember.</p></Card> : undefined}
          onAnswer={(chosen, correct) => recordAttempt({
            kind: 'lesson', refId: lesson.id, source: 'pretest', questionKind: q.kind, exampleId: q.exampleId, chosen, correct, countsForSchedule: false,
          })}
          onNext={() => (qi + 1 < qs.pre.length ? setQi(qi + 1) : go(1))}
        />
      </>
    )
  }

  if (step <= 1)
    return (
      <>
        <Steps step={1} status="Learn" />
        <RuleBody lesson={lesson} audio={audio} />
        <div className="s-sticky-cta">
          <Button block onClick={() => (qs.check.length ? go(2) : finishCheck())}>I've read it · Check myself</Button>
        </div>
      </>
    )

  if (step === 2 && qs.check[qi]) {
    const q = qs.check[qi]
    return (
      <>
        {title}
        <Steps step={2} status={`Check · ${qi + 1} of ${qs.check.length}`} />
        <QuestionView
          key={`chk${qi}`} q={q} mode="check" audio={audio}
          onAnswer={(chosen, correct) => {
            recordAttempt({ kind: 'lesson', refId: q.lessonId, source: 'learn', questionKind: q.kind, exampleId: q.exampleId, chosen, correct, countsForSchedule: false })
            if (correct) setRight(r => r + 1)
          }}
          onNext={() => (qi + 1 < qs.check.length ? setQi(qi + 1) : finishCheck())}
        />
      </>
    )
  }

  if (step === 3) return <Apply lesson={lesson} ex={applyEx} audio={audio} onDone={() => { setMem({ lesson: undefined }); go(4) }} />

  return (
    <section className="s-study s-summary">
      <Steps step={4} status="Done" />
      <Ornament />
      <p className="t-lg"><T>{`${lesson.nameAr} is in your سبقي.`}</T></p>
      <p>It comes back tomorrow and every day this week.</p>
      {qs.check.length > 0 && step === 4 && <p className="num">You answered {right} of {qs.check.length} checks right.</p>}
      <Button block href={href('today')}>Back to today</Button>
    </section>
  )
}

/** Step 4, always shown: an example ayah in the player, the letter drill (مخارج / صفات), or a passage to listen to. */
function Apply({ lesson, ex, audio, onDone }: { lesson: Lesson; ex?: Example; audio: StudyAudio; onDone: () => void }) {
  const vs = useVerse(ex?.verseKey)
  const data = useData()
  const drill = drillFor(lesson).length > 0
  const passage = currentPassage(data, phases)
  const open = (range: string) => { setMem({ lesson: undefined }); navigate(`listen/${range}`) }
  return (
    <>
      <h1 className="a-h3 s-center" lang="ar">{lesson.nameAr}</h1>
      <Steps step={3} status="Apply" />
      <div className="s-study">
        {ex ? (
          <>
            <p className="t-lg"><T>{`Now say it. Listen, repeat, record one ayah with ${lesson.nameAr}.`}</T></p>
            <ExampleVerse ex={ex} vs={vs} size="read" />
            <Button block onClick={() => open(rangeParam(ex.verseKey))}>Open the player</Button>
          </>
        ) : drill ? (
          <Drill lesson={lesson} audio={audio} />
        ) : (
          <>
            <p className="t-lg"><T>{`Now listen for it: ${rangeRef(passage.from, passage.to)}, with the reciter.`}</T></p>
            <Button block onClick={() => open(rangeParam(passage.from, passage.to))}>Open the player</Button>
          </>
        )}
        <Button variant="ghost" block onClick={onDone}>{drill ? 'Done' : 'Skip for today'}</Button>
      </div>
    </>
  )
}
