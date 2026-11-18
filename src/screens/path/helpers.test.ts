import { describe, expect, it } from 'vitest'
import type { PhaseProgress, Session } from '../../core/types'
import { phases } from '../../content'
import {
  accuracy, inRange, likelyLessons, listenHref, mergePassages, milestoneFor, nextTeacherDay, refLabel, studiedDays, weeks, wordSpan,
} from './helpers'

const session = (over: Partial<Session>): Session => ({
  id: 's', createdAt: '', updatedAt: '', deletedAt: null, on: '2026-11-01', plannedPassages: [], milestoneResults: [], status: 'done', ...over,
})
const prog = (st: Record<number, PhaseProgress['status']>): PhaseProgress[] =>
  phases.map((p) => ({ id: p.id, status: st[p.id] ?? 'locked', activatedOn: null, milestoneOn: null, passedOn: null, tasksDone: [] }))

describe('path helpers', () => {
  it('labels ranges in Arabic', () => {
    expect(refLabel('93:5')).toBe('الضحى · ٥')
    expect(refLabel('93:1', '93:5')).toBe('الضحى · ١–٥')
    expect(refLabel('1:1', '1:7')).toBe('الفاتحة')
    expect(refLabel('112:1', '114:6')).toBe('الإخلاص – الناس')
    expect(refLabel('78:3', '80:42')).toBe('النبإ · ٣ – عبس · ٤٢')
    expect(listenHref('93:1', '93:5')).toBe('#/listen/93:1-93:5')
    expect(listenHref('93:5')).toBe('#/listen/93:5')
  })

  it('compares verse keys numerically', () => {
    expect(inRange('93:10', '93:1', '93:11')).toBe(true)
    expect(inRange('93:12', '93:1', '93:11')).toBe(false)
    expect(inRange('113:2', '112:1', '114:6')).toBe(true)
  })

  it('finds the next teacher day', () => {
    // 2026-11-19 is a Thursday (4)
    expect(nextTeacherDay([4], '2026-11-19')).toBe('2026-11-19')
    expect(nextTeacherDay([1], '2026-11-19')).toBe('2026-11-23')
    expect(nextTeacherDay([], '2026-11-19')).toBeNull()
  })

  it('merges passages without duplicates', () => {
    const a = [{ from: '1:1', to: '1:7', reason: 'milestone' as const }]
    expect(mergePassages(a, [{ from: '1:1', to: '1:7', reason: 'ask' }, { from: '2:1', to: '2:1', reason: 'ask' }])).toHaveLength(2)
  })

  it('matches a planned passage to the open milestone (الفاتحة is in phases 1 and 2)', () => {
    const p = { from: '1:1', to: '1:7' }
    expect(milestoneFor(p, phases, prog({ 1: 'milestone' }), [])).toMatchObject({ phaseId: 1, passageId: 'p1-fatiha' })
    const passed1 = session({ milestoneResults: [{ phaseId: 1, passageId: 'p1-fatiha', result: 'passed' }] })
    expect(milestoneFor(p, phases, prog({ 1: 'passed', 2: 'milestone' }), [passed1])).toMatchObject({ phaseId: 2, passageId: 'p2-fatiha' })
    expect(milestoneFor({ from: '2:1', to: '2:5' }, phases, prog({ 1: 'milestone' }), [])).toBeUndefined()
  })

  it('suggests rules from the tapped word, then recent lessons', () => {
    const v = { words: ['وَلَا', 'ٱلضَّآلِّينَ'], tajweed: [{ rule: 'madd_6', start: 8, end: 10, src: 'cpfair' as const }, { rule: 'madd_2', start: 2, end: 3, src: 'cpfair' as const }] }
    expect(wordSpan(v, 2)).toEqual([6, 6 + Array.from('ٱلضَّآلِّينَ').length])
    const intro = [{ lessonId: 'ikhfa', on: '2026-11-01', at: '2026-11-01T10:00:00Z' }, { lessonId: 'iqlab', on: '2026-11-02', at: '2026-11-02T10:00:00Z' }]
    expect(likelyLessons(v, 2, intro, () => true)).toEqual(['lazim-k', 'iqlab', 'ikhfa'])
    expect(likelyLessons(v, undefined, [], () => true)).toEqual(['lazim-k', 'tabii'])
    expect(likelyLessons(v, 2, intro, (id) => id !== 'lazim-k')).toEqual(['iqlab', 'ikhfa'])
  })

  it('counts study weeks and accuracy', () => {
    const studied = studiedDays({
      days: [{ id: '2026-11-14', parts: { listen: 'auto', sabaq: null, recite: null, review: null }, listenSeconds: 200 }],
      attempts: ['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18'].map((on, i) => ({ id: String(i), itemId: null, refId: 'x', kind: 'lesson' as const, on, at: on, source: 'review' as const, correct: i > 0, countsForSchedule: true })),
      introductions: [],
    })
    const w = weeks(studied, '2026-11-19', 2)
    expect(w.weeks[1].start).toBe('2026-11-14') // Saturday
    expect(w.weeks[1].marks.filter((m) => m === 'future')).toHaveLength(1)
    expect(w).toMatchObject({ full: 1, total: 2 })
    expect(weeks(studied, '2026-11-19', 2, '2026-11-14')).toMatchObject({ full: 1, total: 1 })
  })

  it('computes 30-day accuracy on lesson answers only', () => {
    const a = (on: string, correct: boolean, source: 'review' | 'pretest' = 'review') => ({ id: on, itemId: null, refId: 'x', kind: 'lesson' as const, on, at: on, source, correct, countsForSchedule: true })
    expect(accuracy([a('2026-11-19', true), a('2026-11-18', false), a('2026-10-01', true), a('2026-11-19', false, 'pretest')], '2026-11-19')).toEqual({ correct: 1, total: 2 })
  })
})
