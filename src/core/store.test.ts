import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as S from './store'
import { today } from './day'
import { lessons } from '../content'
import { courseOrder, units } from '../content/course'
import { makeWirdIcs } from './ics'
import { courseProgress } from './course'
import { lessonGate } from './scheduler'

beforeEach(() => S.resetAll())

describe('store', () => {
  it('starts with defaults and onboards', () => {
    const d = S.getSnapshot()
    expect(d.settings).toMatchObject({ reciterId: 'husary-muallim', munfasilLength: 4, wirdTime: '05:30', teacherDays: [], theme: 'system' })
    expect(d.finales).toEqual([])
    S.completeOnboarding({ teacherDays: [4] })
    expect(S.getSnapshot().settings.onboardedOn).toBe(today())
    expect(JSON.parse(localStorage.getItem(S.STORAGE_KEY)!).settings.teacherDays).toEqual([4])
  })

  it('introduces lessons, records attempts, completes a unit finale', () => {
    S.completeOnboarding({})
    const ids = courseOrder.slice(0, 2)
    for (const id of ids) S.introduceLesson(id)
    S.introduceLesson(ids[0]) // twice: no-op
    expect(S.getSnapshot().items.map(i => i.id)).toEqual(ids.map(id => `lesson:${id}`))
    const a = S.recordAttempt({ refId: ids[0], kind: 'lesson', source: 'review', correct: true, countsForSchedule: true })
    expect(a.itemId).toBe(`lesson:${ids[0]}`)
    expect(S.getSnapshot().items[0].reps).toBe(1)
    S.completeFinale('u1')
    S.completeFinale('u1')
    expect(S.getSnapshot().finales).toEqual([{ unitId: 'u1', on: today() }])
  })

  it('suggests the unit finale for the next class when it is next', () => {
    const u = units.find(x => x.finale && x.lessonIds.length)
    if (!u) return // course.json finales not filled yet
    S.completeOnboarding({})
    for (const id of courseOrder.slice(0, courseOrder.indexOf(u.lessonIds.at(-1)!) + 1)) S.introduceLesson(id)
    for (const x of units.slice(0, units.indexOf(u))) if (x.finale) S.completeFinale(x.id)
    expect(S.suggestPassages()).toContainEqual({ from: u.finale!.from, to: u.finale!.to, reason: 'milestone' })
  })

  it('logs and resolves corrections', () => {
    const c = S.logCorrection({ verseKey: '1:7', severity: 'jali', lessonIds: [lessons[0].id] })
    expect(S.getSnapshot().items.find(i => i.refId === c.id)).toMatchObject({ state: 'manzil', severity: 'jali' })
    expect(S.suggestPassages()).toContainEqual({ from: '1:7', to: '1:7', reason: 'correction' })
    S.resolveCorrection(c.id, 'correct', 's1')
    expect(S.getSnapshot().corrections[0]).toMatchObject({ status: 'resolved', resolvedInSessionId: 's1' })
    expect(S.getSnapshot().items.find(i => i.refId === c.id)!.state).toBe('closed')
  })

  it('round-trips export/import and rebuilds items', () => {
    S.completeOnboarding({})
    S.introduceLesson(lessons[0].id)
    S.recordAttempt({ refId: lessons[0].id, kind: 'lesson', source: 'review', correct: true, countsForSchedule: true })
    const before = S.getSnapshot()
    const json = S.exportJson()
    expect(S.getSnapshot().settings.lastExportOn).toBe(today())
    S.resetAll()
    S.importJson(json)
    const after = S.getSnapshot()
    expect(after.items).toEqual(before.items)
    expect(after.attempts).toEqual(before.attempts)
    expect(() => S.importJson('{"schemaVersion":99}')).toThrow(/newer/)
    expect(() => S.importJson('nope')).toThrow(/JSON/)
    expect(S.getSnapshot().attempts).toEqual(before.attempts) // unchanged after a refused import
  })

  it('migrates a schemaVersion 0 backup', () => {
    const v0 = {
      schemaVersion: 0,
      settings: { wirdTime: '06:00' },
      items: [{ id: 'old', kind: 'lesson', refId: 'izhar', state: 'sabqi', introducedOn: '2026-01-01', step: 0, dueOn: '2026-01-02', createdAt: '2026-01-01T09:00:00.000Z' }],
      attempts: [{ id: 'a', itemId: 'old', refId: 'izhar', kind: 'lesson', on: '2026-01-02', at: '2026-01-02T09:00:00.000Z', source: 'review', correct: true, countsForSchedule: true }],
    }
    const d = S.migrate(v0, '2026-01-05')
    expect(d.schemaVersion).toBe(2)
    expect(d.settings).toMatchObject({ wirdTime: '06:00', reciterId: 'husary-muallim', munfasilLength: 4 })
    expect(d.introductions).toEqual([{ lessonId: 'izhar', on: '2026-01-01', at: '2026-01-01T09:00:00.000Z' }])
    expect(d.items).toEqual([expect.objectContaining({ id: 'lesson:izhar', state: 'sabqi', reps: 1, sabqiCorrect: 1, dueOn: '2026-01-03' })])
    expect(d.sessions).toEqual([])
    expect(d.finales).toEqual([])
  })

  it('migrates a realistic v1 learner without sending them back to the start (engineering M4)', () => {
    // v1: every v1 lesson of units 1–3 and two of unit 4, done in v1's own order; none of the 9 v2 lessons
    const v1Ids = ['tabii', 'arid', 'iwad', 'ibtida', 'lam-q', 'lam-s', 'lam-jh', 'lam-jl', 'ghunnah', 'izhar', 'idgh-g', 'idgh-n',
      'iqlab', 'ikhfa', 'qal-s', 'qal-k', 'muttasil', 'munfasil', 'mithlayn', 'm-izhar', 'm-idgham']
    const day = (i: number) => `2026-06-${String(1 + i).padStart(2, '0')}`
    const v1 = {
      schemaVersion: 1, updatedAt: '2026-10-01T09:00:00.000Z',
      settings: { wirdTime: '05:30', munfasilLength: 4, introCourseDone: true, teacherDays: [4], onboardedOn: '2026-06-01' },
      attempts: [{ id: 'a1', itemId: 'lesson:tabii', refId: 'tabii', kind: 'lesson', on: '2026-07-01', at: '2026-07-01T09:00:00.000Z', source: 'review', correct: true, countsForSchedule: true }],
      sessions: [], corrections: [], days: [],
      phases: [{ id: 1, status: 'passed', activatedOn: '2026-06-01', milestoneOn: '2026-06-20', passedOn: '2026-06-21', tasksDone: [] }],
      introductions: v1Ids.map((lessonId, i) => ({ lessonId, on: day(i), at: `${day(i)}T09:00:00.000Z` })),
    }
    const d = S.migrate(v1, '2026-11-20')
    expect(d.schemaVersion).toBe(2)
    expect(d.introductions).toHaveLength(v1Ids.length)
    expect(d.finales.map(f => f.unitId)).toEqual(['u0', 'u1', 'u2', 'u3'])
    expect('phases' in d).toBe(false)
    expect('introCourseDone' in d.settings).toBe(false)
    const p = courseProgress(d, units)
    // the frontier is unit 4, not basics: m-ikhfa is next
    expect(p.next).toMatchObject({ kind: 'lesson', id: 'm-ikhfa' })
    // the v2 lessons of passed units are catch-up: open, but they don't lock unit 4
    for (const id of ['basics', 'istiadha', 'tafkhim', 'sakinayn']) expect([p.unlocked(id), p.catchUp(id)]).toEqual([true, true])
    expect(p.unlocked('silah-s')).toBe(false)
    expect(lessonGate(d, units, 'basics', '2026-11-20')).toBe(null)
    expect(lessonGate(d, units, 'm-ikhfa', '2026-11-20')).toBe(null)
    expect(lessonGate(d, units, 'silah-s', '2026-11-20')).toBe('locked')
  })

  it('migrates a v1 learner who has not finished unit 1: basics first', () => {
    const d = S.migrate({ schemaVersion: 1, settings: {}, attempts: [], sessions: [], corrections: [], days: [], phases: [],
      introductions: [{ lessonId: 'tabii', on: '2026-06-01', at: '2026-06-01T09:00:00.000Z' }] }, '2026-11-20')
    expect(d.finales).toEqual([])
    expect(courseProgress(d, units).next).toMatchObject({ kind: 'lesson', id: 'basics' })
  })

  it('keeps unreadable stored data untouched', () => {
    localStorage.setItem(S.STORAGE_KEY, '{"schemaVersion":42}')
    S.reload()
    expect(S.getLoadError()?.raw).toBe('{"schemaVersion":42}')
    S.updateSettings({ wirdTime: '07:00' })
    expect(localStorage.getItem(S.STORAGE_KEY)).toBe('{"schemaVersion":42}')
  })

  it('migrate() repairs malformed data instead of letting a screen crash (M4)', () => {
    const d = S.migrate({
      schemaVersion: 1, settings: { teacherDays: null, wirdTime: '06:00' },
      introductions: [null, { lessonId: 'izhar', on: '2026-01-01', at: 'x' }], attempts: [null, {}], corrections: [null],
      sessions: [null, { id: 's', on: '2026-01-02' }], phases: [], days: [null], finales: [null, { unitId: 'u1' }],
    }, '2026-01-05')
    expect(d.settings).toMatchObject({ teacherDays: [], wirdTime: '06:00', reciterId: 'husary-muallim', munfasilLength: 4 })
    expect(d.introductions).toHaveLength(1)
    expect([d.attempts, d.corrections, d.days]).toEqual([[], [], []])
    expect(d.sessions).toEqual([expect.objectContaining({ id: 's', plannedPassages: [], milestoneResults: [], status: 'planned' })])
    expect(d.finales).toEqual([])
  })

  it('surfaces a failed save and clears it once saving works again (M3)', () => {
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
    S.updateSettings({ wirdTime: '07:00' })
    expect(S.getSaveError()).toBe(true)
    expect(S.getSnapshot().settings.wirdTime).toBe('07:00') // still in memory
    set.mockRestore()
    S.updateSettings({ wirdTime: '07:05' })
    expect(S.getSaveError()).toBe(false)
  })

  it('takes the other tab\'s data when it saves (M2)', () => {
    S.completeOnboarding({})
    const other = { ...S.getSnapshot(), settings: { ...S.getSnapshot().settings, wirdTime: '04:00' } }
    localStorage.setItem(S.STORAGE_KEY, JSON.stringify(other))
    window.dispatchEvent(new StorageEvent('storage', { key: S.STORAGE_KEY }))
    expect(S.getSnapshot().settings.wirdTime).toBe('04:00')
  })
})

describe('ics', () => {
  it('makes a daily wird event and a weekly teacher event', () => {
    const ics = makeWirdIcs({ wirdTime: '05:30', teacherDays: [4] }, 'https://x.app/#/plan', new Date(2026, 10, 19, 12))
    expect(ics).toContain('DTSTART:20261119T053000\r\n')
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('URL:https://x.app/#/today')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TH')
    expect(ics).toContain('DTSTART;VALUE=DATE:20261119')
    expect(makeWirdIcs({ wirdTime: '05:30', teacherDays: [] })).not.toContain('WEEKLY')
  })
})
