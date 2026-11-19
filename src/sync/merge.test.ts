import { describe, expect, it } from 'vitest'
import { canonical, mergeData, sameDoc } from './merge'
import { defaultData, migrate } from '../core/store'
import type { Attempt, Correction, UserData } from '../core/types'

const T = (n: number) => `2026-11-${String(10 + n).padStart(2, '0')}T08:00:00.000Z`

function base(): UserData {
  const d = defaultData()
  d.settings = { ...d.settings, id: 'set', createdAt: T(0), updatedAt: T(0), onboardedOn: '2026-11-10' }
  d.updatedAt = T(0)
  return d
}
const attempt = (id: string, n: number, refId = 'izhar'): Attempt => ({
  id, itemId: null, refId, kind: 'lesson', on: T(n).slice(0, 10), at: T(n), source: 'learn', correct: true, countsForSchedule: true,
})
const correction = (id: string, n: number, patch: Partial<Correction> = {}): Correction => ({
  id, createdAt: T(n), updatedAt: T(n), deletedAt: null, sessionId: null, verseKey: '2:5', severity: 'jali', lessonIds: [],
  status: 'open', by: 'learner', ...patch,
})

describe('mergeData', () => {
  it('two devices: keeps every attempt, introduction and correction from both', () => {
    const a = base(), b = base()
    a.attempts = [attempt('a1', 1), attempt('shared', 2)]
    b.attempts = [attempt('shared', 2), attempt('b1', 3)]
    a.introductions = [{ lessonId: 'izhar', on: '2026-11-11', at: T(1) }]
    b.introductions = [{ lessonId: 'idgham', on: '2026-11-12', at: T(2) }]
    a.corrections = [correction('ca', 1)]
    b.corrections = [correction('cb', 2)]
    const m = mergeData(a, b)
    expect(m.attempts.map((x: Attempt) => x.id).sort()).toEqual(['a1', 'b1', 'shared'])
    expect(m.introductions.map((x: { lessonId: string }) => x.lessonId).sort()).toEqual(['idgham', 'izhar'])
    expect(m.corrections).toHaveLength(2)
  })

  it('same row on both: the newer updatedAt wins, whichever side it is on', () => {
    const a = base(), b = base()
    a.corrections = [correction('c', 1, { status: 'resolved', updatedAt: T(5) })]
    b.corrections = [correction('c', 1, { note: 'older edit', updatedAt: T(3) })]
    expect(mergeData(a, b).corrections[0].status).toBe('resolved')
    expect(mergeData(b, a).corrections[0].status).toBe('resolved')
  })

  it('deletions travel: a soft delete (deletedAt, newer updatedAt) beats the live copy', () => {
    const a = base(), b = base()
    a.corrections = [correction('c', 1)]
    b.corrections = [correction('c', 1, { deletedAt: T(4), updatedAt: T(4) })]
    expect(mergeData(a, b).corrections[0].deletedAt).toBe(T(4))
    expect(mergeData(b, a).corrections[0].deletedAt).toBe(T(4))
  })

  it('settings: the newer one wins whole', () => {
    const a = base(), b = base()
    a.settings = { ...a.settings, wirdTime: '06:00', updatedAt: T(2) }
    b.settings = { ...b.settings, wirdTime: '04:45', teacherName: 'Sh. B', updatedAt: T(6) }
    const m = mergeData(a, b)
    expect(m.settings.wirdTime).toBe('04:45')
    expect(m.settings.teacherName).toBe('Sh. B')
    expect(mergeData(b, a).settings.wirdTime).toBe('04:45')
  })

  it('a day studied on two devices keeps both parts and the longer listening time', () => {
    const a = base(), b = base()
    a.days = [{ id: '2026-11-12', parts: { listen: 'auto', sabaq: null, recite: null, review: null }, listenSeconds: 200 }]
    b.days = [{ id: '2026-11-12', parts: { listen: null, sabaq: 'manual', recite: null, review: null }, listenSeconds: 40 }]
    const d = mergeData(a, b).days[0]
    expect(d.parts).toEqual({ listen: 'auto', sabaq: 'manual', recite: null, review: null })
    expect(d.listenSeconds).toBe(200)
  })

  it('new lists merge generically (finales keyed by unitId), and unknown future fields are kept', () => {
    const a: any = { ...base(), finales: [{ unitId: 'u1', on: '2026-11-12' }], futureScalar: 'x' }
    const b: any = { ...base(), finales: [{ unitId: 'u2', on: '2026-11-13' }], notes: [{ id: 'n1', text: 'hi' }] }
    b.settings = { ...b.settings, someNewSetting: true }
    a.attempts = [{ ...attempt('a1', 1), extra: { deep: 1 } }]
    const m = mergeData(a, b)
    expect(m.finales.map((f: any) => f.unitId).sort()).toEqual(['u1', 'u2'])
    expect(m.notes).toEqual([{ id: 'n1', text: 'hi' }])
    expect(m.futureScalar).toBe('x')
    expect(m.attempts[0].extra).toEqual({ deep: 1 })
  })

  it('scalars: schemaVersion and updatedAt take the max', () => {
    const a: any = { ...base(), schemaVersion: 1, updatedAt: T(9) }
    const b: any = { ...base(), schemaVersion: 2, updatedAt: T(3) }
    const m = mergeData(a, b)
    expect(m.schemaVersion).toBe(2)
    expect(m.updatedAt).toBe(T(9))
  })

  it('is idempotent and stable: merging again changes nothing', () => {
    const a = base(), b = base()
    a.attempts = [attempt('a1', 1)]
    b.attempts = [attempt('b1', 2)]
    b.corrections = [correction('c', 1, { deletedAt: T(4), updatedAt: T(4) })]
    const m = mergeData(a, b)
    expect(canonical(mergeData(m, m))).toBe(canonical(m))
    expect(sameDoc(mergeData(m, b), m)).toBe(true)
    expect(sameDoc(mergeData(m, a), m)).toBe(true)
    expect(sameDoc(mergeData(a, b), mergeData(b, a))).toBe(true)
  })

  it('a missing or empty remote leaves local as is', () => {
    const a = base()
    expect(mergeData(a, null)).toBe(a)
    expect(sameDoc(mergeData(a, {}), a)).toBe(true)
  })

  it('the result still passes the store validation', () => {
    const a = base(), b = base()
    a.attempts = [attempt('a1', 1)]
    b.introductions = [{ lessonId: 'izhar', on: '2026-11-11', at: T(1) }]
    expect(() => migrate(JSON.parse(JSON.stringify(mergeData(a, b))))).not.toThrow()
  })

  it('sameDoc ignores key order (jsonb reorders keys) and the top-level updatedAt', () => {
    expect(sameDoc({ a: 1, b: { c: 1, d: 2 }, updatedAt: 'x' }, { b: { d: 2, c: 1 }, a: 1, updatedAt: 'y' })).toBe(true)
    expect(sameDoc({ a: 1 }, { a: 2 })).toBe(false)
  })
})
