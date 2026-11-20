// #/learn/:lessonId: a v2 lesson (spec 09 §3, docs/10-lesson-ux.md): Hear → Notice → Learn → Say → Find → Check →
// Recite, in one shell (header, step bar, instruction, one primary). Step state is per lesson (lessonSteps.ts).
import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
import { Button, EmptyState, Ornament, Sheet, Skeleton, VerseBlock, type TajweedSegment, type WordMark } from '../components'
import { isAr, t } from '../i18n'
import { tn, Tx } from './study/i18n'
import { rangeRef, verseRef } from './study/helpers'
import { Dots, ExampleCard, flat, PlayButton, useStepper, useVerse, useStudyAudio, type StudyAudio } from './study/verse'
import { Drill } from './study/Drill'
import { QuestionView } from './study/QuestionView'
import { RuleBody } from './study/RuleBody'
import { PassageRecite, Recorder } from './study/Recorder'
import { BottomBar, DoneLine, LessonHeader, StepNav, stepName, type StepState } from './study/LessonShell'
import { checkScore, completeStep, freshSteps, getSteps, missingSteps, saveSteps, scoreCheck, showStep, STEP_IDS, visitStep, type LessonSteps, type StepId } from './study/lessonSteps'
import { playMe } from '../audio/compare'
import './study.css'

const NEXT: Record<StepId, string> = {
  hear: 'Next: Hear the examples', notice: 'Next: Notice the difference', learn: 'Next: Learn the rule', say: 'Next: Say it yourself',
  find: 'Next: Find it in an ayah', check: 'Next: Check what you know', recite: 'Next: Recite the passage',
}
/** The course's "Listen for" note without its own leading "Listen to / for" (the label already says it). */
export function listenFor(s: string) {
  const r = s.replace(/^\s*(listen\s+(to|for)|استمع\s+(إلى|ل)|انتبه\s+(إلى|ل))\s*:?\s*/i, '')
  return r.charAt(0).toUpperCase() + r.slice(1)
}

/**
 * Which examples each step shows: Hear the first three; Say, Learn and Notice start on other examples where the
 * lesson has them, so the same word doesn't open every step.
 */
export function exampleSets<E>(xs: E[]) {
  const hear = xs.slice(0, 3)
  const say = xs.length >= 6 ? xs.slice(3, 6) : [...hear.slice(1), ...hear.slice(0, 1)]
  const fresh = (...not: (E | undefined)[]) => [...xs.slice(3), ...xs.slice(1, 3), ...xs.slice(0, 1)].find(x => !not.includes(x))
  const learn = fresh(hear[0], say[0]) ?? fresh(hear[0]) ?? xs[0]
  const notice = fresh(hear[0], say[0], learn) ?? fresh(hear[0]) ?? xs[0]
  return { hear, say, learn, notice }
}

type FindPick = { v: Verse; targets: number[]; neutral: number[] }
/**
 * The ayah for Find, checked against the tajweed data (`findTargets`): the closing passage first, then the examples'
 * ayahs. Prefers an ayah where the rule is not only on the last (stop) word, where it is ambiguous with المد العارض
 * (UX M5). null: the data finds the rule in none of them; undefined: some ayah couldn't load (unknown, offline).
 */
async function pickFindAyah(lesson: Lesson, closing?: string): Promise<FindPick | null | undefined> {
  const keys = [...new Set([closing, ...lesson.examples.map(e => e.verseKey)].filter((k): k is string => !!k))]
  let fallback: FindPick | null = null
  let unknown = false
  for (const k of keys) {
    const v = await getVerse(k).catch(() => undefined)
    if (!v) { unknown = true; continue }
    const targets = findTargets(v, lesson.id)
    const last = v.words.length
    // stopping turns a final طبيعي into عارض: that word is a sub-case, neither right nor wrong
    const neutral = lesson.id === 'tabii' && !targets.includes(last) && findTargets(v, 'arid').includes(last) ? [last] : []
    if (!targets.length) continue
    const f = { v, targets, neutral }
    if (targets.some(n => n < last)) return f
    fallback ??= f
  }
  return fallback ?? (unknown ? undefined : null)
}

/** Steps with the rule card one tap away (review S1): worked example at hand, but never during Check (retrieval). */
const RULE_SHEET: StepId[] = ['say', 'find', 'recite']

export default function Learn({ params }: ScreenProps) {
  const lesson = getLesson(params.lessonId)
  return lesson ? <LessonFlow key={lesson.id} lesson={lesson} /> : (
    <EmptyState title={t("This lesson isn't in the library.")} action={<Button href={href('today')}>{t('Back to today')}</Button>}>
      {t('The link may be from an older version.')}
    </EmptyState>
  )
}

interface StepProps { lesson: Lesson; audio: StudyAudio; nextLabel: string; onNext: () => void; onDone: () => void; wasDone: boolean }

function LessonFlow({ lesson }: { lesson: Lesson }) {
  const data = useData()
  const audio = useStudyAudio()
  const day = today()
  const course = courseLesson(lesson.id)
  const introducedIds = data.introductions.map(i => i.lessonId)
  const already = introducedIds.includes(lesson.id)
  const munfasil = data.settings.munfasilLength
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fixed per lesson; rebuilt only when the المنفصل length changes
  const qs = useMemo(() => checkQuestions(lesson, lessons, introducedIds.filter(id => id !== lesson.id), munfasil), [lesson, munfasil])
  const other = course.contrastWith ? getLesson(course.contrastWith) : undefined
  const hasNotice = !!(other?.examples.length && lesson.examples.length)
  const sets = useMemo(() => exampleSets(lesson.examples), [lesson])
  const [saved] = useState(() => getSteps(lesson.id))
  // Find exists when the data detects the rule in one of the lesson's ayahs: loaded on open (cached), the answer kept
  // with the lesson's steps, so the step bar doesn't change under the learner. undefined = still loading.
  const [findPick, setFindPick] = useState<FindPick | null>()
  const findOk = findPick !== undefined ? findPick !== null : saved?.find
  const exists = (id: StepId) => !((id === 'hear' && !lesson.examples.length) || (id === 'notice' && !hasNotice) || (id === 'check' && !qs.length) || (id === 'find' && findOk === false))
  const firstStep = STEP_IDS.find(exists) ?? 'learn'
  const nextOf = (id: StepId) => STEP_IDS.slice(STEP_IDS.indexOf(id) + 1).find(exists)

  const [startedToday] = useState(() => saved?.on === day)
  const [st, setSt] = useState<LessonSteps>(() => (saved && exists(saved.current) ? visitStep(saved, saved.current, day) : freshSteps(firstStep, day)))
  const [finished, setFinished] = useState(false)
  const [arrived, setArrived] = useState<StepId | null>(null) // the step just left with the primary: its done line
  const [focusTick, setFocusTick] = useState(0) // a step chosen from the bar: focus its heading
  const [sheet, setSheet] = useState(false)
  const score = checkScore(st)

  useEffect(() => {
    let live = true
    pickFindAyah(lesson, course.closing?.from).then(f => {
      if (!live) return
      setFindPick(f ?? null) // unknown (offline): no Find this visit, nothing remembered
      if (f !== undefined) setSt(s => (s.find === !!f ? s : { ...s, find: !!f }))
    })
    return () => { live = false }
  }, [lesson.id]) // eslint-disable-line react-hooks/exhaustive-deps -- fixed per lesson

  // gate: a new lesson only when it is unlocked and today's pace allows (spec §4); replays and today's resume open
  const gate = !already && !startedToday && !finished ? lessonGate(data, units, lesson.id, day) : null
  useEffect(() => { if (!gate) saveSteps(lesson.id, st) }, [st, gate, lesson.id])

  const step = st.current
  const complete = (id: StepId) => setSt(s => completeStep(s, id, day))
  const go = (id: StepId, from: StepId | null = null) => {
    audio.stop()
    audio.setSlow(false) // Slower and Loop are per step
    audio.setLoop(false)
    setSt(s => visitStep(s, id, day))
    setArrived(from)
    window.scrollTo(0, 0)
  }
  // the focus bar names the step; a step that turns out not to exist (no Find) hands over to the next one
  useEffect(() => { showStep(gate || finished ? null : step) }, [step, gate, finished])
  useEffect(() => () => showStep(null), [])
  useEffect(() => { if (!exists(step)) { const n = nextOf(step); if (n) go(n) } }, [findOk]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (focusTick) document.querySelector<HTMLElement>('.s-lesson h2')?.focus({ preventScroll: true }) }, [focusTick])
  const advance = () => { const n = nextOf(step); if (n) go(n, step) }
  const missing = missingSteps(st, exists, 'recite')
  const finish = () => {
    audio.stop()
    introduceLesson(lesson.id)
    setSt(s => ({ ...completeStep(s, 'recite', day), current: firstStep }))
    setFinished(true)
    window.scrollTo(0, 0)
  }

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
        title={gate === 'backlog' ? t('Review first.')
          : gate === 'pace' ? t('Come back tomorrow for this lesson.')
            : firstId ? <Tx>{t('Finish {x} first.', { x: firstName })}</Tx>
              : unit ? (isAr ? t('This lesson opens later, in unit {n} · {name}.', { n: unit.n, name: unit.nameAr }) : <>This lesson opens later, in unit {unit.n} · <span lang="ar">{unit.nameAr}</span>.</>) : t('This lesson is not in the course yet.')}
        action={<>
          {(gate === 'backlog' || (gate === 'pace' && due)) && <Button href={href('review') + '?go=1'}>{t('Review')}</Button>}
          {firstId && <Button href={href('learn', firstId)}><Tx>{t('Go to {x}', { x: firstName })}</Tx></Button>}
          <Button variant={gate === 'backlog' || (gate === 'pace' && due) || firstId ? 'secondary' : 'primary'} href={href('rules', lesson.id)}>{t('Read the card')}</Button>
        </>}>
        {gate === 'backlog' ? t('More than 15 reviews are overdue. New lessons resume when you catch up.')
          : gate === 'pace' ? `${t('Two new lessons a day is the pace that sticks.')} ${due ? t('Do your review today.') : t('Nothing is due: recite your recent passages from Today, or come back tomorrow.')}`
            : t("Lessons open one after another. You can read the card now; reading it doesn't add it to your reviews.")}
      </EmptyState>
    )
  }

  if (finished) {
    const after = buildQueue(data, units, day)
    const firstTime = data.introductions.find(i => i.lessonId === lesson.id)?.on === day
    return (
      <div className="s-lesson">
        <LessonHeader lesson={lesson} />
        <section className="s-study s-summary">
          <Ornament />
          <p className="t-lg"><Tx>{firstTime ? t('{x} is done. It comes back in your review tomorrow.', { x: lesson.nameAr }) : t('{x}: practised again.', { x: lesson.nameAr })}</Tx></p>
          {course.closing && <p><Tx>{t('Recited {x}', { x: rangeRef(course.closing.from, course.closing.to) })}</Tx></p>}
          {score.m > 0 && <p className="num">{t('Checks: {n} of {m}', score)}</p>}
          {after.sabaq && after.sabaq !== lesson.id && <Button block href={href('learn', after.sabaq)}><Tx>{t('Next lesson: {x}', { x: getLesson(after.sabaq)?.nameAr ?? '' })}</Tx></Button>}
          <Button block variant={after.sabaq && after.sabaq !== lesson.id ? 'secondary' : 'primary'} href={href('today')}>{t('Back to today')}</Button>
        </section>
      </div>
    )
  }

  const stateOf = (id: StepId): StepState =>
    !exists(id) ? 'skipped' : id === step ? 'current' : id === 'find' && findOk === undefined ? 'pending' : st.done.includes(id) ? 'done' : st.visited.includes(id) ? 'visited' : 'new'
  const next = nextOf(step)
  // Find not known yet (first open, still loading): don't promise it
  const nextLabel = !next ? t('Finish lesson') : next === 'find' && findOk === undefined ? t('Next') : t(NEXT[next])
  const p: StepProps = { lesson, audio, nextLabel, onNext: advance, onDone: () => complete(step), wasDone: st.done.includes(step) }
  const n3 = Math.min(3, lesson.examples.length)
  const doneCopy: Record<StepId, ReactNode> = {
    hear: tn('You heard {n} word.', 'You heard {n} words.', n3),
    notice: t('You compared two sounds.'),
    learn: <>{t('You read the rule.')} <span className="muted">{t('A good place to pause: your place is saved.')}</span></>,
    say: tn('You said {n} word.', 'You said {n} words.', n3),
    find: t('You found it in an ayah.'),
    check: t('{n} of {m} right. They come back in review.', score),
    recite: null,
  }
  const instruction: Record<StepId, ReactNode> = {
    hear: t('Listen to each word. What do they have in common?'),
    notice: t('Play both. Which one has the sound you just heard?'),
    learn: t('Read each part, top to bottom. Play the example.'),
    say: t('Play it, say it the same way, then record and compare.'),
    find: <Tx>{t('Tap every word that has {x}. Then tap Check.', { x: lesson.nameAr })}</Tx>,
    check: null, // QuestionView numbers its own question
    recite: course.closing ? <Tx>{t('Recite {x}: listen, record, compare.', { x: rangeRef(course.closing.from, course.closing.to) })}</Tx> : t('Say these words aloud, one after another, the way the reciter does.'),
  }

  return (
    <div className="s-lesson">
      <LessonHeader lesson={lesson} />
      <StepNav stateOf={stateOf} onGo={id => { if (id !== step) go(id); setFocusTick(n => n + 1) }} />
      {arrived && st.done.includes(arrived) && doneCopy[arrived] && <DoneLine key={arrived}>{doneCopy[arrived]}</DoneLine>}
      {instruction[step] && (
        <div className="s-instr">
          <h2 className="t-lg" tabIndex={-1}>{instruction[step]}</h2>
          {RULE_SHEET.includes(step) && <button type="button" className="s-linkbtn" onClick={() => setSheet(true)}>{t('Rule')}</button>}
        </div>
      )}
      {(step === 'hear' || step === 'say') && course.notice && <p className="t-sm muted s-listenfor"><b>{t('Listen for:')}</b> <Tx>{listenFor(course.notice)}</Tx></p>}

      {step === 'hear' && <Hear key="hear" {...p} exs={sets.hear} />}
      {step === 'notice' && other && <Notice key="notice" {...p} other={other} ex={sets.notice} />}
      {step === 'learn' && <LearnStep key="learn" {...p} ex={sets.learn} />}
      {step === 'say' && <Say key="say" {...p} exs={sets.say} />}
      {step === 'find' && (findPick ? <Find key="find" {...p} found={findPick} /> : <Skeleton verse lines={2} label={t('Loading the ayah…')} />)}
      {step === 'check' && (
        <Check key="check" {...p} qs={qs} onScore={r => setSt(s => scoreCheck(s, r, day))} />
      )}
      {step === 'recite' && (
        <Recite key="recite" {...p} closing={course.closing}
          missing={missing} onMissing={() => go(missing[0])} onFinish={finish} />
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title={<span lang="ar">{lesson.nameAr}</span>}>
        {sheet && <RuleBody lesson={lesson} audio={audio} />}
      </Sheet>
    </div>
  )
}

/** Hear: three numbered example cards, one at a time; done when all have played. */
function Hear({ exs, audio, nextLabel, onNext, onDone, wasDone }: StepProps & { exs: Example[] }) {
  const sp = useStepper(exs.length)
  useEffect(() => { if (sp.allPlayed) onDone() }, [sp.allPlayed]) // eslint-disable-line react-hooks/exhaustive-deps
  const ex = exs[sp.at]
  const ok = sp.played(sp.at) || wasDone
  return (
    <>
      <ExampleCard key={ex.id} ex={ex} eyebrow={t('Example {n} of {m}', { n: sp.at + 1, m: exs.length })} audio={audio}
        played={sp.played(sp.at)} onPlayed={() => sp.markPlayed(sp.at)} />
      <Dots n={exs.length} at={sp.at} reached={sp.reached} played={sp.played} onPick={i => { audio.stop(); sp.go(i) }} />
      <BottomBar hint={!ok && (sp.last ? tn('Play the word to continue.', 'Play all {n} words to continue.', exs.length) : t('Play this word to continue.'))}>
        <Button block disabled={!ok} onClick={() => { if (sp.last) onNext(); else { audio.stop(); sp.go(sp.at + 1) } }}>{sp.last ? nextLabel : t('Next word')}</Button>
      </BottomBar>
    </>
  )
}

/**
 * Notice: which one has the sound from Hear? By ear first, then both revealed with their names (spec §3.2). The rule's
 * name is taught in the next step, so the question describes the sound, never the name (UX B2).
 */
function Notice({ lesson, other, ex, audio, nextLabel, onNext, onDone, wasDone }: StepProps & { other: Lesson; ex: Example }) {
  const pair = useMemo(() => {
    const xs = [ex, other.examples[0]]
    return lesson.id.length % 2 ? xs : xs.reverse() // fixed per lesson, not always first
  }, [lesson, other, ex])
  const [played, setPlayed] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const answer = pair.findIndex(ex => ex.lessonId === lesson.id)
  const both = played.length >= 2
  const pick = (i: number) => { setPicked(i); onDone() }
  return (
    <>
      <ol className="s-notice">
        {pair.map((ex, i) => (
          <li key={ex.id}>
            <ExampleCard ex={ex} audio={audio} hidden={picked === null} played={played.includes(i)} onPlayed={() => setPlayed(p => (p.includes(i) ? p : [...p, i]))}
              eyebrow={<>{i === 0 ? t('Sound A') : t('Sound B')}{picked === i && t(' · your pick')}</>}>
              {picked === null ? (
                <Button variant="ghost" disabled={!both} onClick={() => pick(i)}>{t('This one')}</Button>
              ) : i === answer ? (
                <p><b>{t('Has the sound.')}</b> <Tx>{t('This is {x}, the rule you learn next.', { x: lesson.nameAr })}</Tx></p>
              ) : (
                <p><b>{t("Doesn't have it.")}</b> <Tx>{t('This is {x}, an earlier rule.', { x: other.nameAr })}</Tx></p>
              )}
            </ExampleCard>
          </li>
        ))}
      </ol>
      <p role="status">{picked !== null && (picked === answer ? t('Yes, you heard it.') : t('Not this time. Play both again now that you can see them.'))}</p>
      <BottomBar hint={picked === null && !wasDone && (both ? t('Pick the one with the sound to continue.') : t('Play both sounds, then pick one.'))}>
        <Button block disabled={picked === null && !wasDone} onClick={onNext}>{nextLabel}</Button>
      </BottomBar>
    </>
  )
}

/** Learn: the rule in numbered sections; done when Remember has been on screen or the primary is tapped. */
function LearnStep({ lesson, ex, audio, nextLabel, onNext, onDone }: StepProps & { ex?: Example }) {
  return (
    <>
      <RuleBody lesson={lesson} audio={audio} onRead={onDone} example={ex} />
      <BottomBar><Button block onClick={() => { onDone(); onNext() }}>{nextLabel}</Button></BottomBar>
    </>
  )
}

/** Say: listen, record, compare, rate yourself against the "Listen for" criterion; letter drill for مخارج / صفات. */
function Say({ lesson, exs, audio, nextLabel, onNext, onDone, wasDone }: StepProps & { exs: Example[] }) {
  const sp = useStepper(exs.length)
  const [rated, setRated] = useState<Record<number, boolean>>({})
  const drill = drillFor(lesson).length > 0
  const ex = exs[sp.at]
  const vs = useVerse(ex?.verseKey)
  if (!ex)
    return (
      <>
        {drill ? <Drill lesson={lesson} audio={audio} /> : <p>{t('Say the examples on the card aloud, slowly.')}</p>}
        <BottomBar><Button block onClick={() => { onDone(); onNext() }}>{nextLabel}</Button></BottomBar>
      </>
    )
  const allRated = Object.keys(rated).length >= exs.length
  const rate = (same: boolean) => {
    recordAttempt({ kind: 'lesson', refId: lesson.id, source: 'selfrate', exampleId: ex.id, chosen: same ? 'same' : 'not-yet', correct: same, countsForSchedule: false })
    audio.stop()
    const r = { ...rated, [sp.at]: same }
    setRated(r)
    if (Object.keys(r).length >= exs.length) onDone()
    if (!sp.last) sp.go(sp.at + 1)
  }
  const prev = sp.at > 0 && rated[sp.at - 1] !== undefined ? rated[sp.at - 1] : undefined
  const ok = sp.played(sp.at)
  const done = sp.last && rated[sp.at] !== undefined
  return (
    <>
      {drill && sp.at === 0 && (
        <section className="s-warmup"><p className="eyebrow">{t('Warm-up · say each one slowly')}</p><Drill lesson={lesson} audio={audio} /></section>
      )}
      {prev !== undefined && rated[sp.at] === undefined && (
        <DoneLine key={sp.at}>
          {t('Rated. Word {n} of {m}.', { n: sp.at + 1, m: exs.length })}
          {!prev && <span className="muted"> {t('Play the reciter again and listen for the highlighted part.')}</span>}
        </DoneLine>
      )}
      <ExampleCard key={ex.id} ex={ex} eyebrow={t('Example {n} of {m}', { n: sp.at + 1, m: exs.length })} audio={audio}
        played={sp.played(sp.at)} onPlayed={() => sp.markPlayed(sp.at)}>
        <ol className="s-rows">
          <li>
            <p className="s-row-h">{t('Record yourself, then compare')}</p>
            <Recorder key={ex.id} from={`say:${ex.id}`} audio={audio}
              reciter={() => vs.verse && audio.exampleThen(vs.verse, ex, () => {})}
              model={r => vs.verse && audio.exampleThen(vs.verse, ex, () => playMe(audio.player, r))} />
          </li>
          <li><p className="s-row-h">{t('Did it sound the same?')}</p></li>
        </ol>
      </ExampleCard>
      <Dots n={exs.length} at={sp.at} reached={sp.reached} played={i => rated[i] !== undefined} onPick={i => { audio.stop(); sp.go(i) }} />
      {done || (allRated && wasDone) ? (
        <BottomBar><Button block onClick={onNext}>{nextLabel}</Button></BottomBar>
      ) : (
        <BottomBar hint={!ok && t('Play the reciter first, then rate yourself.')}>
          <div className="s-rate" role="group" aria-label={t('Rate yourself')}>
            <Button disabled={!ok} onClick={() => rate(true)}>{t('Yes, the same')}</Button>
            <Button variant="ghost" disabled={!ok} onClick={() => rate(false)}>{t('Not yet')}</Button>
          </div>
          {wasDone && <Button variant="ghost" block onClick={onNext}>{nextLabel}</Button>}
        </BottomBar>
      )}
    </>
  )
}

/** Find: tap every word that shows the rule, then Check (the ayah is picked up front by `pickFindAyah`). Never coloured. */
function Find({ found, audio, nextLabel, onNext, onDone }: StepProps & { found: FindPick }) {
  const [picked, setPicked] = useState<number[]>([])
  const [checked, setChecked] = useState(false)

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
      <VerseBlock segments={flat(wordSegments(v) as TajweedSegment[][])} pauses={v.marks} verseKey={v.verseKey} reference={verseRef(v.verseKey)}
        size="focus" tajweed={false} marks={marks} onWord={n => toggle(n)}
        actions={<PlayButton audio={audio} label={verseRef(v.verseKey)} text={t('Play the ayah')} onClick={() => audio.ayah(v)} />} />
      <p className="t-sm muted">{t('Checked against tajweed data, which can miss a rule that depends on stopping.')}</p>
      <p role="status">
        {checked && (!missed && !extra ? t('All found.') : [missed && t('{n} missed (dashed)', { n: missed }), extra && t('{n} without it (✕)', { n: extra })].filter(Boolean).join(' · '))}
      </p>
      {checked && neutral.some(n => picked.includes(n)) && (
        <p className="t-sm"><Tx>{t('The last word is not counted either way: stopping on it makes its مد an عارض للسكون, which you learn next.')}</Tx></p>
      )}
      <BottomBar hint={!checked && !picked.length && t('Tap at least one word to check.')}>
        {checked
          ? <Button block onClick={onNext}>{nextLabel}</Button>
          : <Button block disabled={!picked.length} onClick={() => { setChecked(true); onDone() }}>{t('Check ({n} picked)', { n: picked.length })}</Button>}
      </BottomBar>
    </div>
  )
}

/** Check: one question per screen; done when every question is answered. A full pass replaces the kept score. */
function Check({ qs, audio, nextLabel, onNext, onScore }: StepProps & { qs: ReturnType<typeof checkQuestions>; onScore: (results: boolean[]) => void }) {
  const [qi, setQi] = useState(0)
  const [res, setRes] = useState<boolean[]>([])
  const cq = qs[qi]
  if (!cq) return null
  const last = qi + 1 >= qs.length
  return (
    <>
      <h2 className="t-lg" tabIndex={-1}>{t('Question {n} of {m}. Read it, then choose one answer.', { n: qi + 1, m: qs.length })}</h2>
      <QuestionView
        key={`chk${qi}`} q={cq} mode="check" audio={audio} nextLabel={last ? nextLabel : t('Next question')}
        onAnswer={(chosen, correct) => {
          recordAttempt({ kind: 'lesson', refId: cq.lessonId, source: 'learn', questionKind: cq.kind, exampleId: cq.exampleId, chosen, correct, countsForSchedule: false })
          const r = [...res]
          r[qi] = correct
          setRes(r)
          if (last) onScore(r)
        }}
        onNext={() => (last ? onNext() : (audio.stop(), setQi(qi + 1), window.scrollTo(0, 0)))}
      />
    </>
  )
}

/** Recite: the closing passage (or the examples), then Finish; finishing waits for the required steps. */
function Recite({ lesson, audio, wasDone, closing, missing, onMissing, onFinish }: StepProps & {
  closing: { from: string; to: string } | null; missing: StepId[]; onMissing: () => void; onFinish: () => void
}) {
  const [ready, setReady] = useState(wasDone)
  const markReady = () => setReady(true)
  return (
    <>
      {closing ? <PassageRecite from={closing.from} to={closing.to} audio={audio} onReady={markReady} /> : <SayAll lesson={lesson} audio={audio} onReady={markReady} />}
      {missing.length ? (
        <BottomBar hint={t('Finishing needs every required step.')}>
          <Button block onClick={onMissing}>{tn('{n} step left: {x}', '{n} steps left: {x}', missing.length, { x: missing.map(stepName).join(isAr ? '، ' : ', ') })}</Button>
        </BottomBar>
      ) : (
        <BottomBar hint={!ready && t('Listen or record first, then finish.')}>
          <Button block disabled={!ready} onClick={onFinish}>{t('Finish lesson')}</Button>
        </BottomBar>
      )}
    </>
  )
}

/** Recite fallback when the lesson has no closing passage yet: the first 5 examples, one at a time, with a recorder. */
function SayAll({ lesson, audio, onReady }: { lesson: Lesson; audio: StudyAudio; onReady: () => void }) {
  const exs = useMemo(() => { const xs = lesson.examples.slice(0, 5); return xs.length > 2 ? [...xs.slice(2), ...xs.slice(0, 2)] : xs }, [lesson]) // not Hear's first again
  const sp = useStepper(exs.length)
  const ex = exs[sp.at]
  const vs = useVerse(ex?.verseKey)
  useEffect(() => { if (!ex) onReady() }, [ex]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!ex) return drillFor(lesson).length ? <Drill lesson={lesson} audio={audio} /> : null
  return (
    <>
      <ExampleCard key={ex.id} ex={ex} eyebrow={t('Example {n} of {m}', { n: sp.at + 1, m: exs.length })} audio={audio}
        played={sp.played(sp.at)} onPlayed={() => { sp.markPlayed(sp.at); onReady() }}>
        <Recorder key={ex.id} from={`say:${ex.id}`} audio={audio} onStatus={onReady}
          reciter={() => vs.verse && audio.exampleThen(vs.verse, ex, () => {})}
          model={r => vs.verse && audio.exampleThen(vs.verse, ex, () => playMe(audio.player, r))} />
      </ExampleCard>
      <Dots n={exs.length} at={sp.at} reached={exs.length - 1} played={sp.played} onPick={i => { audio.stop(); sp.go(i) }} />
    </>
  )
}
