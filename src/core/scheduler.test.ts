import { describe, expect, it } from 'vitest'
import type { Attempt, Correction, Introduction, Lesson, Phase, ReviewItem, UserData } from './types'
import { addDays, diffDays, today, weekDays } from './day'
import { applyAttempt, buildQueue, levelOf, rebuildItems } from './scheduler'
import { seeded } from './questions'

const D0 = '2026-01-01'
const d = (n: number) => addDays(D0, n)
let seq = 0
const at = (day: string) => new Date(Date.parse(`${day}T10:00:00Z`) + seq++).toISOString()
const intro = (lessonId: string, n = 0): Introduction => ({ lessonId, on: d(n), at: `${d(n)}T09:00:00.000Z` })
const att = (refId: string, n: number, correct: boolean, extra: Partial<Attempt> = {}): Attempt => ({
  id: `a${seq}`, itemId: null, refId, kind: 'lesson', on: d(n), at: at(d(n)), source: 'review', correct, countsForSchedule: true, ...extra,
})
const corr = (id: string, n: number, lessonIds: string[], severity: Correction['severity'] = 'khafi', extra: Partial<Correction> = {}): Correction => ({
  id, createdAt: `${d(n)}T08:00:00.000Z`, updatedAt: `${d(n)}T08:00:00.000Z`, deletedAt: null, on: d(n), sessionId: null,
  verseKey: '1:7', severity, lessonIds, status: 'open', by: 'learner', ...extra,
})
const one = (items: ReviewItem[], refId: string) => items.find(i => i.refId === refId)!

describe('day', () => {
  it('rolls over at 03:00 local', () => {
    expect(today(new Date(2026, 0, 2, 2, 59))).toBe('2026-01-01')
    expect(today(new Date(2026, 0, 2, 3, 0))).toBe('2026-01-02')
    expect(today(new Date(2026, 2, 1, 1, 0))).toBe('2026-02-28')
  })
  it('adds and diffs days', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(diffDays('2026-03-01', '2026-02-28')).toBe(1)
    expect(weekDays('2026-11-19')[0]).toBe('2026-11-14') // Saturday
  })
})

describe('sabqi', () => {
  it('is due every day for the first 7 days', () => {
    const atts: Attempt[] = []
    let items = rebuildItems([intro('x')], atts, [], d(0))
    expect(one(items, 'x')).toMatchObject({ state: 'sabqi', dueOn: d(1) })
    for (let n = 1; n <= 6; n++) {
      atts.push(att('x', n, n % 2 === 0))
      items = rebuildItems([intro('x')], atts, [], d(n))
      expect(one(items, 'x')).toMatchObject({ state: 'sabqi', dueOn: d(n + 1) })
    }
  })

  it('graduates to step 2 with ≥4 correct and the last correct', () => {
    const atts = [1, 2, 3].map(n => att('x', n, true)).concat(att('x', 7, true))
    expect(one(rebuildItems([intro('x')], atts, [], d(7)), 'x')).toMatchObject({ state: 'manzil', step: 2, dueOn: d(14) })
  })

  it('graduates to step 0 when the last is wrong or fewer than 4 correct', () => {
    const lastWrong = [1, 2, 3, 4].map(n => att('x', n, true)).concat(att('x', 7, false))
    expect(one(rebuildItems([intro('x')], lastWrong, [], d(7)), 'x')).toMatchObject({ state: 'manzil', step: 0, dueOn: d(8), lapses: 0 })
    const few = [att('x', 1, true), att('x', 2, true), att('x', 9, true)] // learner away; graduates on day 9
    expect(one(rebuildItems([intro('x')], few, [], d(9)), 'x')).toMatchObject({ state: 'manzil', step: 0, dueOn: d(10) })
  })
})

describe('manzil ladder', () => {
  const grad = [1, 2, 3, 4].map(n => att('x', n, true)).concat(att('x', 7, true)) // step 2, due d14
  it('climbs 7 → 14 → 30 → 60 → 120 and caps at 120', () => {
    const atts = [...grad]
    let day = 14
    for (const [step, gap] of [[3, 14], [4, 30], [5, 60], [6, 120], [6, 120]]) {
      atts.push(att('x', day, true))
      expect(one(rebuildItems([intro('x')], atts, [], d(day)), 'x')).toMatchObject({ step, dueOn: d(day + gap) })
      day += gap
    }
  })
  it('wrong → step 0, tomorrow, lapse', () => {
    const it = one(rebuildItems([intro('x')], [...grad, att('x', 14, false)], [], d(14)), 'x')
    expect(it).toMatchObject({ step: 0, dueOn: d(15), lapses: 1 })
  })
  it('early correct changes nothing; early wrong resets', () => {
    const base = one(rebuildItems([intro('x')], grad, [], d(10)), 'x')
    const early = one(rebuildItems([intro('x')], [...grad, att('x', 10, true, { source: 'early' })], [], d(10)), 'x')
    expect([early.step, early.dueOn]).toEqual([base.step, base.dueOn])
    const wrong = one(rebuildItems([intro('x')], [...grad, att('x', 10, false, { source: 'early' })], [], d(10)), 'x')
    expect(wrong).toMatchObject({ step: 0, dueOn: d(11) })
  })
  it('late review counts from the answer day', () => {
    const it = one(rebuildItems([intro('x')], [...grad, att('x', 40, true)], [], d(40)), 'x')
    expect(it).toMatchObject({ step: 3, dueOn: d(54) })
  })
  it('ignores attempts that do not count (pretest, relearn)', () => {
    const it = one(rebuildItems([intro('x')], [...grad, att('x', 14, false, { source: 'relearn', countsForSchedule: false })], [], d(14)), 'x')
    expect(it.step).toBe(2)
  })
})

describe('corrections', () => {
  const grad = (id: string) => [1, 2, 3, 4].map(n => att(id, n, true)).concat(att(id, 7, true))
  it('resets linked manzil lessons, leaves sabqi lessons, flags corrected-before-taught', () => {
    const intros = [intro('m'), intro('s', 8)]
    const c = corr('c1', 9, ['m', 's', 'later'])
    const items = rebuildItems([...intros, intro('later', 12)], grad('m'), [c], d(12))
    expect(one(items, 'm')).toMatchObject({ state: 'manzil', step: 0, dueOn: d(10) })
    expect(one(items, 's')).toMatchObject({ state: 'sabqi', dueOn: d(9) })
    expect(one(items, 'later').correctedBeforeTaught).toBe(true)
    expect(one(items, 'm').correctedBeforeTaught).toBeUndefined()
    expect(one(items, 'c1')).toMatchObject({ kind: 'correction', state: 'manzil', step: 0, dueOn: d(10) })
  })
  it('caps self-rated جلي at step 1 and خفي at step 3', () => {
    const ok = (id: string, n: number) => att(id, n, true, { kind: 'correction', source: 'selfrate' })
    const days = [1, 4, 11, 25, 60]
    const j = rebuildItems([], days.map(n => ok('j', n)), [corr('j', 0, [], 'jali')], d(60))
    expect(one(j, 'j').step).toBe(1)
    const k = rebuildItems([], days.map(n => ok('k', n)), [corr('k', 0, [], 'khafi')], d(60))
    expect(one(k, 'k').step).toBe(3)
  })
  it('teacher: still wrong is a lapse and resets lessons; correct now closes', () => {
    const c = corr('c1', 8, ['m'])
    const still = att('c1', 20, false, { kind: 'correction', source: 'teacher', chosen: 'still_wrong' })
    const atts = [...grad('m'), att('m', 15, true), still]
    const items = rebuildItems([intro('m')], atts, [c], d(20))
    expect(one(items, 'c1')).toMatchObject({ step: 0, dueOn: d(21), lapses: 1 })
    expect(one(items, 'm')).toMatchObject({ step: 0, dueOn: d(21) })
    const closed = rebuildItems([intro('m')], [...atts, att('c1', 27, true, { kind: 'correction', source: 'teacher' })], [{ ...c, status: 'resolved' }], d(27))
    expect(one(closed, 'c1').state).toBe('closed')
    // closed items ignore further answers
    const after = applyAttempt(closed, att('c1', 28, false, { kind: 'correction', source: 'selfrate' }))
    expect(one(after, 'c1')).toMatchObject({ state: 'closed', lapses: 1 })
  })
})

describe('rebuild == incremental', () => {
  it('matches over random histories', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = seeded(seed)
      const ids = ['a', 'b', 'c', 'd']
      const intros = ids.map((id, i) => intro(id, i * 3))
      const corrections = [corr('k1', 5, ['a', 'b']), corr('j1', 11, ['c'], 'jali')]
      let items: ReviewItem[] = []
      const atts: Attempt[] = []
      for (let n = 0; n < 120; n++) {
        const intrToday = intros.filter(i => i.on === d(n))
        const corrToday = corrections.filter(c => c.on === d(n))
        if (intrToday.length || corrToday.length) // non-attempt events: the store rebuilds
          items = rebuildItems(intros.filter(i => i.on <= d(n)), atts, corrections.filter(c => c.on! <= d(n)), d(n))
        for (const it of items.filter(i => i.dueOn <= d(n) || rng() < 0.05)) {
          const teacher = it.kind === 'correction' && rng() < 0.2
          const a = att(it.refId, n, rng() < 0.75, { kind: it.kind, source: teacher ? 'teacher' : it.kind === 'correction' ? 'selfrate' : 'review' })
          atts.push(a)
          items = applyAttempt(items, a)
        }
      }
      const resolved = corrections.map(c => (atts.some(a => a.refId === c.id && a.source === 'teacher' && a.correct) ? { ...c, status: 'resolved' as const } : c))
      const sort = (x: ReviewItem[]) => [...x].sort((p, q) => (p.id < q.id ? -1 : 1))
      expect(atts.length).toBeGreaterThan(80)
      expect(items.some(i => i.state === 'manzil' && i.step >= 3)).toBe(true)
      expect(sort(rebuildItems(intros, atts, resolved, d(120)))).toEqual(sort(items))
    }
  })
})

/* ---------------- queue ---------------- */

const lessonStub = (id: string, phaseId: number): Lesson => ({
  id, topicId: 't', phaseId, order: 0, nameAr: id, nameEn: id, colour: 'clear', summary: '', examples: [], facts: [],
  questionKinds: ['identify'], confusableWith: [], sources: [], review: { status: 'verified' },
})
const L = ['p1', 'p2', 'p3'].map(id => lessonStub(id, 1))
const P: Phase[] = [{ id: 1, weeks: '', nameAr: '', nameEn: '', goal: '', doneWhen: '', lessonIds: ['p1', 'p2', 'p3'], tasks: [], milestone: [] }]
const item = (refId: string, over: Partial<ReviewItem>): ReviewItem => ({
  id: `lesson:${refId}`, kind: 'lesson', refId, state: 'manzil', introducedOn: D0, step: 1, dueOn: D0, lastReviewedOn: null,
  lastExampleId: null, reps: 0, lapses: 0, createdAt: '', updatedAt: '', deletedAt: null, ...over,
})
const userData = (over: Partial<UserData>): UserData => ({
  schemaVersion: 1, settings: {} as UserData['settings'], introductions: [], items: [], attempts: [], sessions: [], corrections: [],
  phases: [{ id: 1, status: 'active', activatedOn: D0, milestoneOn: null, passedOn: null, tasksDone: [] }], days: [], ...over,
})

describe('buildQueue', () => {
  const T = d(30)
  it('caps at 20, sabqi always fits, overflow kept', () => {
    const sabqi = Array.from({ length: 5 }, (_, i) => item(`s${i}`, { state: 'sabqi', dueOn: T }))
    const manzil = Array.from({ length: 25 }, (_, i) => item(`m${String(i).padStart(2, '0')}`, { dueOn: d(30 - i) }))
    const q = buildQueue(userData({ items: [...sabqi, ...manzil] }), L, P, T)
    expect(q.sabqi).toHaveLength(5)
    expect(q.manzil).toHaveLength(15)
    expect(q.overflowCount).toBe(10)
    expect(q.manzil[0].refId).toBe('m24') // most overdue first
    expect(buildQueue(userData({ items: [...sabqi, ...manzil] }), L, P, T, 10).manzil).toHaveLength(25)
  })
  it('orders جلي, خفي, recently corrected lessons, then the rest; جلي never cut', () => {
    const jali = Array.from({ length: 22 }, (_, i) => ({ ...item(`j${i}`, { dueOn: T }), id: `correction:j${i}`, kind: 'correction' as const, severity: 'jali' as const }))
    const khafi = { ...item('k', { dueOn: d(1) }), id: 'correction:k', kind: 'correction' as const, severity: 'khafi' as const }
    const q1 = buildQueue(userData({ items: [khafi, ...jali] }), L, P, T)
    expect(q1.manzil).toHaveLength(22)
    expect(q1.overflowCount).toBe(1)

    const rest = [item('old', { dueOn: d(1), step: 3 }), item('linked', { dueOn: T }), item('old2', { dueOn: d(1), step: 1 })]
    const q2 = buildQueue(userData({ items: [...rest, khafi, jali[0]], corrections: [corr('cc', 28, ['linked'])] }), L, P, T)
    expect(q2.manzil.map(i => i.refId)).toEqual(['j0', 'k', 'linked', 'old2', 'old'])
  })
  it('counts items already reviewed today toward the cap', () => {
    const manzil = Array.from({ length: 25 }, (_, i) => item(`m${i}`, { dueOn: T }))
    const done = Array.from({ length: 12 }, (_, i) => att(`done${i}`, 30, true))
    expect(buildQueue(userData({ items: manzil, attempts: done }), L, P, T).manzil).toHaveLength(8)
  })
  it('offers one sabaq; blocks it on backlog > 15, introduced today, milestone', () => {
    const introductions = [intro('p1', 0)]
    expect(buildQueue(userData({ introductions }), L, P, T).sabaq).toBe('p2')
    const backlog = Array.from({ length: 16 }, (_, i) => item(`m${i}`, { dueOn: T }))
    expect(buildQueue(userData({ introductions, items: backlog }), L, P, T)).toMatchObject({ sabaq: null, sabaqReason: 'backlog' })
    expect(buildQueue(userData({ introductions, items: backlog.slice(1) }), L, P, T).sabaq).toBe('p2')
    expect(buildQueue(userData({ introductions: [intro('p1', 30)] }), L, P, T).sabaqReason).toBe('introduced-today')
    const all = ['p1', 'p2', 'p3'].map(id => intro(id, 0))
    expect(buildQueue(userData({ introductions: all }), L, P, T).sabaqReason).toBe('milestone')
  })
  it('offers a corrected-before-taught lesson first', () => {
    const q = buildQueue(userData({ corrections: [corr('c', 29, ['p3'])] }), L, P, T)
    expect(q).toMatchObject({ sabaq: 'p3', sabaqCorrected: true })
  })
  it('welcomes back after ≥ 7 days away', () => {
    const items = Array.from({ length: 34 }, (_, i) => item(`m${i}`, { dueOn: d(20) }))
    const q = buildQueue(userData({ items, attempts: [att('m0', 22, true)] }), L, P, T)
    expect(q.welcomeBack).toEqual({ due: 34, daysToCatchUp: 2 })
    expect(buildQueue(userData({ items, attempts: [att('m0', 25, true)] }), L, P, T).welcomeBack).toBeUndefined()
  })
})

describe('levelOf', () => {
  const T = d(100)
  it('follows §6.7', () => {
    expect(levelOf(undefined, [], [], T)).toBe('not-started')
    expect(levelOf(item('x', { state: 'sabqi', step: 0 }), [], [], T)).toBe('learning')
    expect(levelOf(item('x', { step: 1 }), [], [], T)).toBe('learning')
    expect(levelOf(item('x', { step: 2 }), [], [], T)).toBe('known')
    expect(levelOf(item('x', { step: 3 }), [], [], T)).toBe('strong')
    expect(levelOf(item('x', { step: 4 }), [att('x', 80, false)], [], T)).toBe('known')
    expect(levelOf(item('x', { step: 4 }), [att('x', 60, false)], [], T)).toBe('strong')
  })
})
