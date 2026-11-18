import { describe, expect, it } from 'vitest'
import { confusableHint, dueLabel, rangeParam, rangeRef, spread, teacherNear, verseRef, week } from './helpers'
import type { DayLog, Session } from '../../core/types'

const log = (id: string, review: boolean): DayLog => ({ id, parts: { listen: null, sabaq: null, recite: null, review: review ? 'auto' : null }, listenSeconds: 0 })

describe('study helpers', () => {
  it('formats references in Arabic-Indic digits', () => {
    expect(verseRef('93:5')).toBe('الضحى · ٥')
    expect(rangeRef('93:1', '93:11')).toBe('الضحى · ١–١١')
    expect(rangeParam('1:1', '1:1')).toBe('1:1')
    expect(rangeParam('93:1', '93:5')).toBe('93:1-93:5')
  })

  it('gives the confusable hint only for the partner', () => {
    const pairs = [{ id: 'p', a: 'ikhfa', b: 'idgh-g', hint: 'H' }]
    expect(confusableHint(pairs, 'idgh-g', 'ikhfa')).toBe('H')
    expect(confusableHint(pairs, 'ikhfa', 'idgh-g')).toBe('H')
    expect(confusableHint(pairs, 'ikhfa', 'izhar')).toBeUndefined()
  })

  it('labels due days', () => {
    expect(dueLabel('2026-11-19', '2026-11-19')).toBe('today')
    expect(dueLabel('2026-11-20', '2026-11-19')).toBe('tomorrow')
    expect(dueLabel('2026-11-30', '2026-11-19')).toBe('30 Nov')
  })

  it('marks the week Saturday first', () => {
    // 2026-11-19 is a Thursday: Sat 14 … Fri 20
    const w = week([log('2026-11-14', true), log('2026-11-16', false), log('2026-11-19', true), log('2026-11-02', true)], '2026-11-19')
    expect(w.marks).toEqual(['studied', 'not', 'not', 'not', 'not', 'studied', 'future'])
    expect(w.todayIndex).toBe(5)
    expect(w.count).toBe(2)
    expect(w.month).toBe(3)
  })

  it('finds a near teacher day or planned session', () => {
    expect(teacherNear([5], [], '2026-11-19')?.when).toBe('tomorrow') // Fri
    expect(teacherNear([4], [], '2026-11-19')?.when).toBe('today')
    expect(teacherNear([1], [], '2026-11-19')).toBeNull()
    const s = { id: 's', on: '2026-11-20', status: 'planned', deletedAt: null } as Session
    expect(teacherNear([], [s], '2026-11-19')).toEqual({ when: 'tomorrow', session: s })
  })

  it('spreads long items apart when possible', () => {
    const isC = (x: string) => x.startsWith('c')
    expect(spread(['c1', 'c2', 'l1', 'l2'], isC)).toEqual(['c1', 'l1', 'c2', 'l2'])
    expect(spread(['c1', 'c2', 'c3'], isC)).toEqual(['c1', 'c2', 'c3'])
    expect(spread(['l1', 'c1', 'l2'], isC)).toEqual(['l1', 'c1', 'l2'])
  })
})
