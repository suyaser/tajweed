// #/learn/:lessonId: a v2 lesson (spec 09 §3, docs/10-lesson-ux.md): Hear → Notice → Learn → Say → Find → Check →
// Recite, in one shell (header, step bar, instruction, one primary). Step state is per lesson (lessonSteps.ts).
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import { VerseBlock, type TajweedSegment, type WordMark } from '../components'
import { Callout, Chip, EmptyState, Panel, STEP_ICONS } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { isAr, SEP, t } from '../i18n'
import { tn, Tx } from './study/i18n'
import { rangeRef, verseRef } from './study/helpers'
import { ExampleAudio, ExampleCard, flat, PlayButton, stepperNav, useStepper, useVerse, useStudyAudio, type StudyAudio } from './study/verse'
import { Drill } from './study/Drill'
import { QuestionView } from './study/QuestionView'
import { RuleBody } from './study/RuleBody'
import videos from '../../content/videos.json'
import { CompareControl, PassageRecite, RecordControl, Recorder, RowCard, useTakes } from './study/Recorder'
import { BottomBar, DoneLine, Instruction, LessonHeader, StepNav, stepName, type StepState } from './study/LessonShell'
import { checkScore, completeStep, freshSteps, getSteps, missingSteps, saveSteps, scoreCheck, showStep, STEP_IDS, visitStep, type LessonSteps, type StepId } from './study/lessonSteps'
import { playMe } from '../audio/compare'

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
const COLUMN = 'mx-auto flex w-full max-w-[640px] min-w-0 flex-col gap-space-lg pt-space-sm lg:max-w-none'
/** Gate and done screens: one centred column on desktop too. */
const NARROW = `${COLUMN} lg:max-w-[760px]`
/** One-column steps (Check, Recite) on desktop. */
const SOLO = 'flex min-w-0 flex-col gap-space-lg max-lg:contents lg:mx-auto lg:w-full lg:max-w-[760px]'

/**
 * From lg a step uses the width: `aside` (the word or ayah) at the start, sticky under the bar, and the step's work
 * beside it. On phones both wrappers are `contents`, so the children are one column in this order and the bottom bar
 * stays sticky as before.
 */
function Split({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="contents lg:grid lg:grid-cols-2 lg:items-start lg:gap-gutter-md">
      <div className="contents lg:sticky lg:top-24 lg:flex lg:min-w-0 lg:flex-col lg:gap-space-lg">{aside}</div>
      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-space-lg">{children}</div>
    </div>
  )
}
const Next = ({ children }: { children: ReactNode }) => <>{children}<Icon name="arrow_forward" size={20} rtlFlip /></>

export default function Learn({ params }: ScreenProps) {
  const lesson = getLesson(params.lessonId)
  return lesson ? <LessonFlow key={lesson.id} lesson={lesson} /> : (
    <EmptyState className="mt-space-lg" icon="search_off" title={t("This lesson isn't in the library.")}
      action={<Button asChild><a href={href('today')}>{t('Back to today')}</a></Button>}>
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
  useEffect(() => { if (focusTick) document.querySelector<HTMLElement>('[data-lesson] h2')?.focus({ preventScroll: true }) }, [focusTick])
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
    const reviewFirst = gate === 'backlog' || (gate === 'pace' && due)
    return (
      <div className={NARROW}>
        <LessonHeader lesson={lesson} />
        <EmptyState
          icon={gate === 'pace' ? 'bedtime' : gate === 'backlog' ? 'history' : 'lock'}
          title={gate === 'backlog' ? t('Review first.')
            : gate === 'pace' ? t('Come back tomorrow for this lesson.')
              : firstId ? <Tx>{t('Finish {x} first.', { x: firstName })}</Tx>
                : unit ? (isAr ? t('This lesson opens later, in unit {n} · {name}.', { n: unit.n, name: unit.nameAr }) : <>This lesson opens later, in unit {unit.n}: <bdi lang="ar">{unit.nameAr}</bdi>.</>) : t('This lesson is not in the course yet.')}
          action={
            <div className="flex flex-col items-stretch gap-space-sm">
              {reviewFirst && <Button asChild><a href={href('review') + '?go=1'}>{t('Review')}</a></Button>}
              {firstId && <Button asChild><a href={href('learn', firstId)}><Tx>{t('Go to {x}', { x: firstName })}</Tx></a></Button>}
              <Button variant={reviewFirst || firstId ? 'secondary' : 'primary'} asChild><a href={href('rules', lesson.id)}>{t('Read the card')}</a></Button>
            </div>
          }>
          {gate === 'backlog' ? t('More than 15 reviews are overdue. New lessons resume when you catch up.')
            : gate === 'pace' ? `${t('Two new lessons a day is the pace that sticks.')} ${due ? t('Do your review today.') : t('Nothing is due: recite your recent passages from Today, or come back tomorrow.')}`
              : t("Lessons open one after another. You can read the card now; reading it doesn't add it to your reviews.")}
        </EmptyState>
      </div>
    )
  }

  if (finished) {
    const after = buildQueue(data, units, day)
    const firstTime = data.introductions.find(i => i.lessonId === lesson.id)?.on === day
    const nextId = after.sabaq && after.sabaq !== lesson.id ? after.sabaq : null
    return (
      <div className={NARROW}>
        <LessonHeader lesson={lesson} />
        <Panel className="items-center text-center">
          <span className="grid size-16 place-items-center rounded-full bg-secondary-container text-on-secondary-container"><Icon name="star" size={32} fill /></span>
          <h2 className="text-headline-md text-on-surface" tabIndex={-1}>
            <Tx>{firstTime ? t('{x} is done. It comes back in your review tomorrow.', { x: lesson.nameAr }) : t('{x}: practised again.', { x: lesson.nameAr })}</Tx>
          </h2>
          <div className="flex flex-wrap justify-center gap-space-sm">
            {course.closing && <Chip icon="verified"><Tx>{t('Recited {x}', { x: rangeRef(course.closing.from, course.closing.to) })}</Tx></Chip>}
            {score.m > 0 && <Chip icon="fact_check" tone="primary">{t('Checks: {n} of {m}', score)}</Chip>}
          </div>
        </Panel>
        <div className="flex flex-col gap-space-sm">
          {nextId && <Button size="lg" asChild><a href={href('learn', nextId)}><Next><Tx>{t('Next lesson: {x}', { x: getLesson(nextId)?.nameAr ?? '' })}</Tx></Next></a></Button>}
          <Button size={nextId ? 'default' : 'lg'} variant={nextId ? 'secondary' : 'primary'} asChild><a href={href('today')}>{t('Back to today')}</a></Button>
        </div>
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
    learn: <>{t('You read the rule.')} <span className="opacity-80">{t('A good place to pause: your place is saved.')}</span></>,
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
    check: null, // Check numbers its own question
    recite: course.closing ? <Tx>{t('Recite {x}: listen, record, compare.', { x: rangeRef(course.closing.from, course.closing.to) })}</Tx> : t('Say these words aloud, one after another, the way the reciter does.'),
  }
  const notice = course.notice ? <Callout variant="listen-for" title={t('Listen for')}><Tx>{listenFor(course.notice)}</Tx></Callout> : null

  return (
    <div className={COLUMN} data-lesson="">
      <LessonHeader lesson={lesson} action={RULE_SHEET.includes(step) && (
        <Chip icon="menu_book" tone="gold" onClick={() => setSheet(true)}>{t('Rule')}</Chip>
      )} />
      <StepNav stateOf={stateOf} onGo={id => { if (id !== step) go(id); setFocusTick(n => n + 1) }} />
      {arrived && st.done.includes(arrived) && doneCopy[arrived] && <DoneLine key={arrived}>{doneCopy[arrived]}</DoneLine>}
      {instruction[step] && <Instruction icon={STEP_ICONS[step]}>{instruction[step]}</Instruction>}

      {step === 'hear' && <Hear key="hear" {...p} exs={sets.hear} notice={notice} />}
      {step === 'notice' && other && <Notice key="notice" {...p} other={other} ex={sets.notice} />}
      {step === 'learn' && <LearnStep key="learn" {...p} ex={sets.learn} />}
      {step === 'say' && <Say key="say" {...p} exs={sets.say} notice={notice} />}
      {step === 'find' && (findPick ? <Find key="find" {...p} found={findPick} /> : (
        <Panel as="div" role="status"><span className="sr-only">{t('Loading the ayah…')}</span>{[0, 1].map(i => <Skeleton key={i} className="h-10 w-full" />)}</Panel>
      ))}
      {step === 'check' && (
        <Check key="check" {...p} qs={qs} onScore={r => setSt(s => scoreCheck(s, r, day))} />
      )}
      {step === 'recite' && (
        <Recite key="recite" {...p} closing={course.closing}
          missing={missing} onMissing={() => go(missing[0])} onFinish={finish} />
      )}

      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent side="bottom" className="gap-0 overflow-y-auto" aria-describedby={undefined}>
          <SheetHeader><SheetTitle lang="ar" className="text-arabic-headline">{lesson.nameAr}</SheetTitle></SheetHeader>
          <div className="px-space-md pb-space-lg sm:px-space-lg">{sheet && <RuleBody lesson={lesson} audio={audio} />}</div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/** Hear: three numbered example cards, one at a time; done when all have played. */
function Hear({ exs, audio, nextLabel, onNext, onDone, wasDone, notice }: StepProps & { exs: Example[]; notice: ReactNode }) {
  const sp = useStepper(exs.length)
  useEffect(() => { if (sp.allPlayed) onDone() }, [sp.allPlayed]) // eslint-disable-line react-hooks/exhaustive-deps
  const ex = exs[sp.at]
  const ok = sp.played(sp.at) || wasDone
  return (
    <Split aside={<ExampleCard key={ex.id} ex={ex} audio={audio} nav={stepperNav(sp, audio)} played={sp.played(sp.at)} onPlayed={() => sp.markPlayed(sp.at)} />}>
      {notice}
      <BottomBar hint={!ok && (sp.last ? tn('Play the word to continue.', 'Play all {n} words to continue.', exs.length) : t('Play this word to continue.'))}>
        <Button size="lg" disabled={!ok} onClick={() => { if (sp.last) onNext(); else { audio.stop(); sp.go(sp.at + 1) } }}>
          <Next>{sp.last ? nextLabel : t('Next word')}</Next>
        </Button>
      </BottomBar>
    </Split>
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
      <ol className="flex flex-col gap-space-md lg:grid lg:grid-cols-2 lg:items-start lg:gap-gutter-md">
        {pair.map((ex, i) => (
          <li key={ex.id}>
            <ExampleCard ex={ex} audio={audio} hidden={picked === null} played={played.includes(i)} onPlayed={() => setPlayed(p => (p.includes(i) ? p : [...p, i]))}
              eyebrow={<>{i === 0 ? t('Sound A') : t('Sound B')}{picked === i && t(' · your pick')}</>}>
              {picked === null ? (
                <Button variant="secondary" disabled={!both} onClick={() => pick(i)}><Icon name="touch_app" size={20} />{t('This one')}</Button>
              ) : i === answer ? (
                <Callout variant="tip" icon="check_circle" title={t('Has the sound.')}><Tx>{t('This is {x}, the rule you learn next.', { x: lesson.nameAr })}</Tx></Callout>
              ) : (
                <Callout variant="note" icon="remove" title={t("Doesn't have it.")}><Tx>{t('This is {x}, an earlier rule.', { x: other.nameAr })}</Tx></Callout>
              )}
            </ExampleCard>
          </li>
        ))}
      </ol>
      <p role="status" className="text-center text-body-lg font-medium text-on-surface empty:hidden">
        {picked !== null && (picked === answer ? t('Yes, you heard it.') : t('Not this time. Play both again now that you can see them.'))}
      </p>
      <BottomBar hint={picked === null && !wasDone && (both ? t('Pick the one with the sound to continue.') : t('Play both sounds, then pick one.'))}>
        <Button size="lg" disabled={picked === null && !wasDone} onClick={onNext}><Next>{nextLabel}</Next></Button>
      </BottomBar>
    </>
  )
}

/** Learn: the rule in numbered sections; done when Remember has been on screen or the primary is tapped. */
function LearnStep({ lesson, ex, audio, nextLabel, onNext, onDone }: StepProps & { ex?: Example }) {
  return (
    <>
      <RuleBody lesson={lesson} audio={audio} onRead={onDone} example={ex} />
      <VideoLink lessonId={lesson.id} />
      <BottomBar><Button size="lg" onClick={() => { onDone(); onNext() }}><Next>{nextLabel}</Next></Button></BottomBar>
    </>
  )
}

/** Where م. علاء حامد explains this rule in his course (content/videos.json, timed from the episode transcripts). */
function VideoLink({ lessonId }: { lessonId: string }) {
  const v = (videos.lessons as Record<string, { ep: number; t: number } | undefined>)[lessonId]
  if (!v) return null
  const at = `${Math.floor(v.t / 60)}:${String(v.t % 60).padStart(2, '0')}`
  return (
    <a href={`https://www.youtube.com/watch?v=${videos.episodes[v.ep - 1]}&t=${v.t}s`} target="_blank" rel="noopener"
      className="flex items-center gap-space-md rounded-card border border-outline-variant bg-surface-container-lowest p-space-md no-underline hover:bg-surface-container-low">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-container text-primary"><Icon name="smart_display" size={22} /></span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-lg font-semibold text-on-surface">{t('Watch it explained')}</span>
        <span className="text-body-md text-on-surface-variant"><Tx>{t('م. علاء حامد, episode {n} at {at}', { n: v.ep, at })}</Tx></span>
      </span>
      <Icon name="open_in_new" size={18} className="text-outline" />
    </a>
  )
}

/** Say's numbered cards for one example (keyed by it): 1 Listen, 2 Record yourself, 3 Compare. */
function SayRows({ ex, audio, played, onPlayed }: { ex: Example; audio: StudyAudio; played: boolean; onPlayed: () => void }) {
  const vs = useVerse(ex.verseKey)
  const r = useTakes(`say:${ex.id}`, `say:${ex.id}`, audio)
  return (
    <>
      <RowCard n={1} title={t('Listen')}>
        <ExampleAudio ex={ex} audio={audio} played={played} onPlayed={onPlayed} />
      </RowCard>
      <RowCard n={2} title={t('Record yourself')} status={r.last && !r.recording && <Chip tone="success" icon="check_circle" fill>{t('Recorded')}</Chip>}>
        <RecordControl r={r} />
        <p className="text-center text-caption text-on-surface-variant">{t('Recordings stay on this device.')}</p>
      </RowCard>
      <RowCard n={3} title={t('Compare')}>
        <CompareControl r={r}
          reciter={() => vs.verse && audio.exampleThen(vs.verse, ex, () => {})}
          model={take => vs.verse && audio.exampleThen(vs.verse, ex, () => playMe(audio.player, take))} />
      </RowCard>
    </>
  )
}

/** Say: listen, record, compare, rate yourself against the "Listen for" criterion; letter drill for مخارج / صفات. */
function Say({ lesson, exs, audio, nextLabel, onNext, onDone, wasDone, notice }: StepProps & { exs: Example[]; notice: ReactNode }) {
  const sp = useStepper(exs.length)
  const [rated, setRated] = useState<Record<number, boolean>>({})
  const drill = drillFor(lesson).length > 0
  const ex = exs[sp.at]
  if (!ex)
    return (
      <>
        {drill ? <Drill lesson={lesson} audio={audio} /> : <p className="text-body-lg">{t('Say the examples on the card aloud, slowly.')}</p>}
        <BottomBar><Button size="lg" onClick={() => { onDone(); onNext() }}><Next>{nextLabel}</Next></Button></BottomBar>
      </>
    )
  const allRated = Object.keys(rated).length >= exs.length
  const recorded = useRef(new Set<number>()) // one attempt per word: a double tap (or a change of mind) never logs twice
  const rate = (same: boolean) => {
    if (!recorded.current.has(sp.at)) recordAttempt({ kind: 'lesson', refId: lesson.id, source: 'selfrate', exampleId: ex.id, chosen: same ? 'same' : 'not-yet', correct: same, countsForSchedule: false })
    recorded.current.add(sp.at)
    audio.stop()
    const r = { ...rated, [sp.at]: same }
    setRated(r)
    if (Object.keys(r).length >= exs.length) onDone()
    if (!sp.last) { sp.go(sp.at + 1); window.scrollTo(0, 0) }
  }
  const prev = sp.at > 0 && rated[sp.at - 1] !== undefined ? rated[sp.at - 1] : undefined
  const ok = sp.played(sp.at)
  const mine = rated[sp.at]
  const canGo = allRated || wasDone
  return (
    <Split aside={<>
      {drill && sp.at === 0 && (
        <section className="flex flex-col gap-space-sm">
          <p className="text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">{t('Warm-up · say each one slowly')}</p>
          <Drill lesson={lesson} audio={audio} />
        </section>
      )}
      {prev !== undefined && mine === undefined && (
        <DoneLine key={sp.at}>
          {t('Rated. Word {n} of {m}.', { n: sp.at + 1, m: exs.length })}
          {!prev && <> {t('Play the reciter again and listen for the highlighted part.')}</>}
        </DoneLine>
      )}
      <ExampleCard key={ex.id} ex={ex} audio={audio} audioRow={false} nav={stepperNav(sp, audio)} played={sp.played(sp.at)} onPlayed={() => sp.markPlayed(sp.at)} />
    </>}>
      <SayRows key={`rows:${ex.id}`} ex={ex} audio={audio} played={sp.played(sp.at)} onPlayed={() => sp.markPlayed(sp.at)} />
      {notice}
      <Panel aria-labelledby="say-rate">
        <h3 id="say-rate" className="text-headline-md text-on-surface">{t('Did it sound the same?')}</h3>
        <div className="grid grid-cols-2 gap-space-sm" role="group" aria-label={t('Rate yourself')}>
          <Button variant="secondary" disabled={!ok} aria-pressed={mine === false} onClick={() => rate(false)}
            className={cn('h-auto min-h-12 whitespace-normal', mine === false && 'border-primary bg-surface-container')}>
            <Icon name="replay" size={20} />{t('Not yet')}
          </Button>
          <Button variant="secondary" disabled={!ok} aria-pressed={mine === true} onClick={() => rate(true)}
            className={cn('h-auto min-h-12 whitespace-normal border-transparent bg-primary-container text-on-primary-container hover:bg-primary-container/80', mine === true && 'ring-2 ring-primary')}>
            <Icon name="done_all" size={20} />{t('Sounds the same')}
          </Button>
        </div>
        {!ok && <p className="text-body-md text-on-surface-variant">{t('Play the reciter first, then rate yourself.')}</p>}
      </Panel>
      <BottomBar hint={!canGo && t('Rate each word to continue.')}>
        <Button size="lg" disabled={!canGo} onClick={onNext}><Next>{nextLabel}</Next></Button>
      </BottomBar>
    </Split>
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
    <Split aside={
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <Chip icon="bookmark"><span lang="ar">{verseRef(v.verseKey)}</span></Chip>
          <PlayButton audio={audio} label={verseRef(v.verseKey)} text={t('Play the ayah')} onClick={() => audio.ayah(v)} />
        </div>
        <VerseBlock segments={flat(wordSegments(v) as TajweedSegment[][])} pauses={v.marks} verseKey={v.verseKey}
          size="focus" tajweed={false} marks={marks} onWord={n => toggle(n)} chips />
        <p className="text-caption text-on-surface-variant">{t('Checked against tajweed data, which can miss a rule that depends on stopping.')}</p>
      </Panel>}>
      <p role="status" className="flex items-center justify-center gap-space-xs text-center text-body-lg font-medium text-on-surface empty:hidden">
        {checked && (!missed && !extra ? t('All found.') : [missed && t('{n} missed', { n: missed }), extra && t('{n} not this one', { n: extra })].filter(Boolean).join(SEP))}
      </p>
      {checked && neutral.some(n => picked.includes(n)) && (
        <Callout variant="note"><Tx>{t('The last word is not counted either way: stopping on it makes its مد an عارض للسكون, which you learn next.')}</Tx></Callout>
      )}
      <BottomBar hint={!checked && !picked.length && t('Tap at least one word to check.')}>
        {checked
          ? <Button size="lg" onClick={onNext}><Next>{nextLabel}</Next></Button>
          : <Button size="lg" disabled={!picked.length} onClick={() => { setChecked(true); onDone() }}><Icon name="fact_check" size={20} />{t('Check ({n} picked)', { n: picked.length })}</Button>}
      </BottomBar>
    </Split>
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
    <div className={SOLO}>
      <Instruction icon="fact_check">{t('Question {n} of {m}. Read it, then choose one answer.', { n: qi + 1, m: qs.length })}</Instruction>
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
    </div>
  )
}

/** Recite: the closing passage (or the examples), then Finish; finishing waits for the required steps. */
function Recite({ lesson, audio, wasDone, closing, missing, onMissing, onFinish }: StepProps & {
  closing: { from: string; to: string } | null; missing: StepId[]; onMissing: () => void; onFinish: () => void
}) {
  const [ready, setReady] = useState(wasDone)
  const markReady = () => setReady(true)
  return (
    <div className={SOLO}>
      {closing ? <PassageRecite from={closing.from} to={closing.to} audio={audio} onReady={markReady} /> : <SayAll lesson={lesson} audio={audio} onReady={markReady} />}
      {missing.length ? (
        <BottomBar hint={t('Finishing needs every required step.')}>
          <Button size="lg" onClick={onMissing}><Next>{tn('{n} step left: {x}', '{n} steps left: {x}', missing.length, { x: missing.map(stepName).join(isAr ? '، ' : ', ') })}</Next></Button>
        </BottomBar>
      ) : (
        <BottomBar hint={!ready && t('Listen or record first, then finish.')}>
          <Button size="lg" disabled={!ready} onClick={onFinish}><Icon name="check_circle" size={20} />{t('Finish lesson')}</Button>
        </BottomBar>
      )}
    </div>
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
  const goto = (i: number) => { audio.stop(); sp.go(i) }
  // every example is open here (no order to enforce): forward too
  const nav = { ...stepperNav(sp, audio), onNext: sp.last ? undefined : () => goto(sp.at + 1), onPick: goto, reached: exs.length - 1 }
  return (
    <ExampleCard key={ex.id} ex={ex} audio={audio} nav={nav} played={sp.played(sp.at)} onPlayed={() => { sp.markPlayed(sp.at); onReady() }}>
      <Recorder key={ex.id} from={`say:${ex.id}`} audio={audio} onStatus={onReady}
        reciter={() => vs.verse && audio.exampleThen(vs.verse, ex, () => {})}
        model={r => vs.verse && audio.exampleThen(vs.verse, ex, () => playMe(audio.player, r))} />
    </ExampleCard>
  )
}
