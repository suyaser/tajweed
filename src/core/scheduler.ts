// Spec §6: سبق · سبقي · منزل. Pure functions; `items` is a cache rebuilt from history.
import type { Attempt, Correction, Day, Introduction, ReviewItem, Unit, UserData } from './types'
import { addDays, diffDays, today as dayOf } from './day'
import { courseProgress } from './course'

export const LADDER = [1, 3, 7, 14, 30, 60, 120] // step → days
export const DAILY_CAP = 20
export const BACKLOG_LIMIT = 15
export const NEW_PER_DAY = 2 // decision 22: at most 2 new lessons a study day
const SABQI_DAYS = 7

export const itemIdOf = (kind: ReviewItem['kind'], refId: string) => `${kind}:${refId}`

const capOf = (it: ReviewItem) => (it.kind === 'correction' ? (it.severity === 'jali' ? 1 : 3) : 6)
const correctionDay = (c: Correction): Day => c.on ?? dayOf(new Date(c.createdAt))

type Items = Map<string, ReviewItem>

function resetLinkedLessons(items: Items, lessonIds: string[], on: Day, at: string) {
  for (const id of lessonIds) {
    const it = items.get(itemIdOf('lesson', id))
    if (it?.state === 'manzil') Object.assign(it, { step: 0, dueOn: addDays(on, 1), updatedAt: at }) // sabqi is already daily
  }
}

/** One schedule-counting attempt (§6.3). Mutates `items`. */
function applyOne(items: Items, a: Attempt) {
  if (!a.countsForSchedule) return
  const it = items.get(itemIdOf(a.kind, a.refId))
  if (!it || it.state === 'closed' || it.state === 'suspended') return
  it.updatedAt = a.at

  if (a.source === 'teacher') {
    // re-check by the teacher: "correct now" closes, "still wrong" is a lapse
    if (a.correct) it.state = 'closed'
    else {
      Object.assign(it, { step: 0, dueOn: addDays(a.on, 1), lapses: it.lapses + 1 })
      resetLinkedLessons(items, it.linkedLessonIds ?? [], a.on, a.at)
    }
    return
  }

  it.reps++
  it.lastReviewedOn = a.on
  if (a.exampleId) it.lastExampleId = a.exampleId

  if (it.state === 'sabqi') {
    const correct = (it.sabqiCorrect ?? 0) + (a.correct ? 1 : 0)
    it.sabqiCorrect = correct
    if (diffDays(a.on, it.introducedOn) < SABQI_DAYS) {
      it.dueOn = addDays(a.on, 1)
    } else {
      // graduation: this answer is the last sabqi answer; a pass starts at the 3-day step (decision 13)
      const pass = correct >= 4 && a.correct
      Object.assign(it, { state: 'manzil', step: pass ? 1 : 0, dueOn: addDays(a.on, LADDER[pass ? 1 : 0]) })
    }
    return
  }

  if (!a.correct) Object.assign(it, { step: 0, dueOn: addDays(a.on, 1), lapses: it.lapses + 1 })
  else if (a.on >= it.dueOn) {
    // on time or late: the interval counts from the answer day
    it.step = Math.min(it.step + 1, capOf(it))
    it.dueOn = addDays(a.on, LADDER[it.step])
  } // correct before due: no change
}

const blank = (kind: ReviewItem['kind'], refId: string, on: Day, at: string): ReviewItem => ({
  id: itemIdOf(kind, refId), kind, refId, state: kind === 'lesson' ? 'sabqi' : 'manzil', introducedOn: on,
  step: 0, dueOn: addDays(on, 1), lastReviewedOn: null, lastExampleId: null, reps: 0, lapses: 0,
  createdAt: at, updatedAt: at, deletedAt: null,
})

type Ev =
  | { t: 0; at: string; on: Day; intro: Introduction }
  | { t: 1; at: string; on: Day; corr: Correction }
  | { t: 2; at: string; on: Day; att: Attempt }

/** Replays introductions, corrections and attempts in time order through §6.3. Pure. */
export function rebuildItems(introductions: Introduction[], attempts: Attempt[], corrections: Correction[], today: Day): ReviewItem[] {
  const live = corrections.filter(c => !c.deletedAt)
  const evs: Ev[] = [
    ...introductions.map(intro => ({ t: 0 as const, at: intro.at, on: intro.on, intro })),
    ...live.map(corr => ({ t: 1 as const, at: corr.createdAt, on: correctionDay(corr), corr })),
    ...attempts.filter(a => a.countsForSchedule).map(att => ({ t: 2 as const, at: att.at, on: att.on, att })),
  ].filter(e => e.on <= today)
  evs.sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : x.t - y.t))

  const items: Items = new Map()
  const correctedEarly = new Set<string>()
  for (const e of evs) {
    if (e.t === 0) {
      const id = itemIdOf('lesson', e.intro.lessonId)
      const prev = items.get(id)
      const it = blank('lesson', e.intro.lessonId, e.on, e.at)
      if (prev) Object.assign(it, { createdAt: prev.createdAt, reps: prev.reps, lapses: prev.lapses, lastExampleId: prev.lastExampleId })
      if (correctedEarly.has(e.intro.lessonId)) it.correctedBeforeTaught = true
      items.set(id, it)
    } else if (e.t === 1) {
      const c = e.corr
      items.set(itemIdOf('correction', c.id), { ...blank('correction', c.id, e.on, e.at), severity: c.severity, linkedLessonIds: c.lessonIds })
      for (const l of c.lessonIds) if (!items.has(itemIdOf('lesson', l))) correctedEarly.add(l)
      resetLinkedLessons(items, c.lessonIds, e.on, e.at)
    } else applyOne(items, e.att)
  }
  // a resolved correction is closed even if the teacher attempt is missing (e.g. hand-edited import)
  for (const c of live) {
    const it = items.get(itemIdOf('correction', c.id))
    if (it && c.status === 'resolved') it.state = 'closed'
  }
  return [...items.values()]
}

/** Incremental version of rebuildItems for one new attempt (must give the same result). */
export function applyAttempt(items: ReviewItem[], attempt: Attempt): ReviewItem[] {
  const map: Items = new Map(items.map(i => [i.id, { ...i }]))
  applyOne(map, attempt)
  return [...map.values()]
}

/* ---------------- Daily queue (§6.5–6.6) ---------------- */

/** Why there is no new lesson today: the pace limit, the review backlog, a unit finale to recite first, or the course is done. */
export type SabaqReason = 'pace' | 'backlog' | 'finale' | 'done'

export interface Queue {
  sabaq: string | null
  sabaqReason?: SabaqReason // why sabaq is null
  finaleUnit?: string // sabaqReason 'finale': the unit whose finale is next
  sabqi: ReviewItem[]
  manzil: ReviewItem[]
  overflowCount: number // due manzil items left for later
  welcomeBack?: { due: number; daysToCatchUp: number }
}

/** `extra` raises today's cap ("10 more"). Items already reviewed today count toward the cap. */
export function buildQueue(data: UserData, units: Unit[], today: Day, extra = 0): Queue {
  const live = data.items.filter(i => !i.deletedAt)
  const sabqi = live.filter(i => i.state === 'sabqi' && i.dueOn <= today)
  const recentCorrected = new Set(
    data.corrections.filter(c => !c.deletedAt && diffDays(today, correctionDay(c)) < 7).flatMap(c => c.lessonIds),
  )
  const group = (i: ReviewItem) =>
    i.kind === 'correction' ? (i.severity === 'jali' ? 0 : 1) : i.kind === 'lesson' && recentCorrected.has(i.refId) ? 2 : 3
  const due = live
    .filter(i => i.state === 'manzil' && i.dueOn <= today)
    .sort((a, b) => group(a) - group(b) || (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0) || a.step - b.step || (a.id < b.id ? -1 : 1))

  const reviewedToday = new Set(
    data.attempts.filter(a => a.on === today && a.countsForSchedule && a.source !== 'teacher').map(a => itemIdOf(a.kind, a.refId)),
  ).size
  const room = Math.max(0, DAILY_CAP + extra - sabqi.length - reviewedToday)
  const jali = due.filter(i => group(i) === 0) // never cut
  const manzil = [...jali, ...due.slice(jali.length).slice(0, Math.max(0, room - jali.length))]

  const q: Queue = { sabaq: null, sabqi, manzil, overflowCount: due.length - manzil.length }

  // سبق: the next lesson in course order (spec §4)
  const next = courseProgress(data, units).next
  if (next.kind === 'done') q.sabaqReason = 'done'
  else if (next.kind === 'finale') Object.assign(q, { sabaqReason: 'finale', finaleUnit: next.unit.id })
  else if (data.introductions.filter(i => i.on === today).length >= NEW_PER_DAY) q.sabaqReason = 'pace'
  else if (due.length > BACKLOG_LIMIT) q.sabaqReason = 'backlog'
  else q.sabaq = next.id

  // welcome back after ≥ 7 days away
  const activeDays = [
    ...data.attempts.map(a => a.on),
    ...data.introductions.map(i => i.on),
    ...data.days.filter(d => d.parts.sabaq || d.parts.review).map(d => d.id),
  ].filter(d => d < today)
  const last = activeDays.sort().pop()
  if (last && diffDays(today, last) >= 7) {
    const n = sabqi.length + due.length
    q.welcomeBack = { due: n, daysToCatchUp: Math.max(1, Math.ceil(n / DAILY_CAP)) }
  }
  return q
}

/* ---------------- Levels (§6.7) ---------------- */

export type Level = 'not-started' | 'learning' | 'known' | 'strong'

/** Decision 13: strong = the 30-day step and the last 3 answers correct, each on a different example. */
export function levelOf(item: ReviewItem | undefined, attempts: Attempt[], _corrections: Correction[], _today: Day): Level {
  if (!item) return 'not-started'
  if (item.state === 'sabqi' || item.step <= 1) return 'learning'
  if (item.step < 4) return 'known'
  const last3 = attempts
    .filter(a => a.kind === item.kind && a.refId === item.refId && a.countsForSchedule && a.source !== 'teacher')
    .sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0))
    .slice(-3)
  const strong = last3.length === 3 && last3.every(a => a.correct) && new Set(last3.map(a => a.exampleId)).size === 3
  return strong ? 'strong' : 'known'
}

/** "teacher correction open" badge (§6.7). */
export const hasOpenCorrection = (lessonId: string, corrections: Correction[]) =>
  corrections.some(c => !c.deletedAt && c.status === 'open' && c.lessonIds.includes(lessonId))
