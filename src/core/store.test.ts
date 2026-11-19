import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as S from './store'
import { today } from './day'
import { lessons, phases } from '../content'
import { makeWirdIcs } from './ics'

beforeEach(() => S.resetAll())

describe('store', () => {
  it('starts with defaults and onboards into phase 1', () => {
    const d = S.getSnapshot()
    expect(d.settings).toMatchObject({ reciterId: 'husary-muallim', munfasilLength: 4, wirdTime: '05:30', teacherDays: [], theme: 'system' })
    S.completeOnboarding({ introCourseDone: true, teacherDays: [4] })
    const p = S.getSnapshot().phases
    expect(p[0]).toMatchObject({ status: 'active', activatedOn: today(), tasksDone: [0, 1] })
    expect(p.slice(1).every(x => x.status === 'locked')).toBe(true)
    expect(JSON.parse(localStorage.getItem(S.STORAGE_KEY)!).settings.teacherDays).toEqual([4])
  })

  it('introduces a lesson, records attempts, moves the phase to milestone', () => {
    S.completeOnboarding({})
    const p1 = phases[0].lessonIds
    for (const id of p1) S.introduceLesson(id)
    expect(S.getSnapshot().items.map(i => i.id)).toEqual(p1.map(id => `lesson:${id}`))
    expect(S.getSnapshot().phases[0].status).toBe('milestone')
    const a = S.recordAttempt({ refId: p1[0], kind: 'lesson', source: 'review', correct: true, countsForSchedule: true })
    expect(a.itemId).toBe(`lesson:${p1[0]}`)
    expect(S.getSnapshot().items[0].reps).toBe(1)
  })

  it('logs and resolves corrections', () => {
    const c = S.logCorrection({ verseKey: '1:7', severity: 'jali', lessonIds: [lessons[0].id] })
    expect(S.getSnapshot().items.find(i => i.refId === c.id)).toMatchObject({ state: 'manzil', severity: 'jali' })
    expect(S.suggestPassages()).toContainEqual({ from: '1:7', to: '1:7', reason: 'correction' })
    S.resolveCorrection(c.id, 'correct', 's1')
    expect(S.getSnapshot().corrections[0]).toMatchObject({ status: 'resolved', resolvedInSessionId: 's1' })
    expect(S.getSnapshot().items.find(i => i.refId === c.id)!.state).toBe('closed')
  })

  it('passes a phase when every milestone passage passed, activating the next', () => {
    S.completeOnboarding({})
    const s = S.planSession()
    S.updateSession(s.id, { status: 'done', milestoneResults: phases[0].milestone.map(m => ({ phaseId: 1, passageId: m.id, result: 'passed' as const })) })
    expect(S.getSnapshot().phases.slice(0, 2).map(p => p.status)).toEqual(['passed', 'active'])
    S.skipPhase(2, 'teacher away')
    expect(S.getSnapshot().phases.slice(1, 3).map(p => p.status)).toEqual(['skipped', 'active'])
  })

  it('opens the next phase once half the milestone passed; the rest stay planned (decision 12)', () => {
    S.completeOnboarding({})
    for (const id of [1, 2, 3]) S.setPhaseStatus(id, 'passed')
    S.setPhaseStatus(4, 'milestone')
    expect(S.getSnapshot().phases.map(p => p.status)).toEqual(['passed', 'passed', 'passed', 'milestone', 'locked', 'locked'])
    const ms = phases[3].milestone
    const pass = (ids: typeof ms) => S.updateSession(S.planSession().id, { status: 'done', milestoneResults: ids.map(m => ({ phaseId: 4, passageId: m.id, result: 'passed' as const })) })
    pass(ms.slice(0, 2))
    expect(S.getSnapshot().phases[4].status).toBe('locked')
    pass(ms.slice(2, 3))
    expect(S.getSnapshot().phases.slice(3).map(p => p.status)).toEqual(['milestone', 'active', 'locked'])
    expect(S.suggestPassages().filter(p => p.reason === 'milestone')).toHaveLength(3)
    pass(ms.slice(3))
    expect(S.getSnapshot().phases.slice(3).map(p => p.status)).toEqual(['passed', 'active', 'locked'])
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
    expect(d.schemaVersion).toBe(1)
    expect(d.settings).toMatchObject({ wirdTime: '06:00', reciterId: 'husary-muallim', munfasilLength: 4 })
    expect(d.introductions).toEqual([{ lessonId: 'izhar', on: '2026-01-01', at: '2026-01-01T09:00:00.000Z' }])
    expect(d.items).toEqual([expect.objectContaining({ id: 'lesson:izhar', state: 'sabqi', reps: 1, sabqiCorrect: 1, dueOn: '2026-01-03' })])
    expect(d.sessions).toEqual([])
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
      sessions: [null, { id: 's', on: '2026-01-02' }], phases: [], days: [null],
    }, '2026-01-05')
    expect(d.settings).toMatchObject({ teacherDays: [], wirdTime: '06:00', reciterId: 'husary-muallim', munfasilLength: 4 })
    expect(d.introductions).toHaveLength(1)
    expect([d.attempts, d.corrections, d.days]).toEqual([[], [], []])
    expect(d.sessions).toEqual([expect.objectContaining({ id: 's', plannedPassages: [], milestoneResults: [], status: 'planned' })])
    expect(d.phases.map(p => p.id)).toEqual([1, 2, 3, 4, 5, 6])
    expect(d.phases.every(p => p.status === 'locked' && Array.isArray(p.tasksDone))).toBe(true)
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
