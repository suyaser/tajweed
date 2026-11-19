import { describe, expect, it } from 'vitest'
import type { Unit } from './types'
import { courseProgress, migratedFinales } from './course'
import { buildCourse, courseLesson, courseOrder, units } from '../content/course'
import { getLesson } from '../content'

const unit = (id: string, lessonIds: string[], finale = true): Unit => ({
  id, n: 0, nameAr: id, nameEn: id, surahs: '', intro: '', lessonIds, mutun: [], finale: finale ? { from: '1:1', to: '1:7', label: id } : null,
})
// u0 has no finale; u2 is finale-only (like الفاتحة)
const U = [unit('u0', ['a'], false), unit('u1', ['b', 'c']), unit('u2', []), unit('u3', ['d'])]
const intro = (...ids: string[]) => ids.map(lessonId => ({ lessonId, on: '2026-11-01', at: '' }))

describe('courseProgress', () => {
  it('walks lessons in order, then each finale, unit by unit', () => {
    const p = (ids: string[], fin: string[] = []) => courseProgress({ introductions: intro(...ids), finales: fin.map(unitId => ({ unitId, on: '' })) }, U)
    expect(p([]).next).toMatchObject({ kind: 'lesson', id: 'a' })
    expect(p(['a']).next).toMatchObject({ kind: 'lesson', id: 'b' }) // no finale: u1 opens with u0's lessons
    expect(p(['a', 'b', 'c']).next).toMatchObject({ kind: 'finale', unit: { id: 'u1' } })
    expect(p(['a', 'b', 'c'], ['u1']).next).toMatchObject({ kind: 'finale', unit: { id: 'u2' } })
    expect(p(['a', 'b', 'c'], ['u1', 'u2']).next).toMatchObject({ kind: 'lesson', id: 'd' })
    expect(p(['a', 'b', 'c', 'd'], ['u1', 'u2', 'u3']).next).toEqual({ kind: 'done' })
    const q = p(['a', 'b'])
    expect([q.unlocked('a'), q.unlocked('c'), q.unlocked('d')]).toEqual([true, true, false])
    expect(U.map(q.open)).toEqual([true, true, false, false])
  })
  it('treats new lessons of a passed (migrated) unit as catch-up, not the frontier', () => {
    // v1 learner: u1 lesson b is new in v2; u0 and u1 are migrated as passed, so u2 (finale only) is next and a, b stay open
    const fin = [{ unitId: 'u0', on: '' }, { unitId: 'u1', on: '' }]
    const p = courseProgress({ introductions: intro('c'), finales: fin }, U)
    expect(p.next).toMatchObject({ kind: 'finale', unit: { id: 'u2' } })
    expect([p.unlocked('a'), p.unlocked('b'), p.catchUp('b'), p.unlocked('d')]).toEqual([true, true, true, false])
  })
})

describe('migratedFinales', () => {
  // real ids: v1 lessons, plus basics and istiadha (new in v2)
  const R = [unit('u0', ['basics'], false), unit('u1', ['istiadha', 'tabii', 'arid']), unit('u2', []), unit('u3', ['izhar']), unit('u4', ['ikhfa'])]
  it('passes a unit when its v1 lessons are done; units with no v1 lessons follow the next one', () => {
    expect(migratedFinales(intro('tabii'), R)).toEqual([])
    expect(migratedFinales(intro('tabii', 'arid'), R).map(f => f.unitId)).toEqual(['u0', 'u1'])
    expect(migratedFinales(intro('tabii', 'arid', 'izhar'), R).map(f => f.unitId)).toEqual(['u0', 'u1', 'u2', 'u3'])
    expect(migratedFinales(intro('ikhfa'), R).map(f => f.unitId)).toEqual(['u4'])
  })
})

describe('course content', () => {
  it('drops lesson ids missing from rules.json and handles null fields', () => {
    const c = buildCourse({
      units: [{ id: 'u1', n: 1, nameAr: '', nameEn: '', surahs: '', intro: '', lessons: ['izhar', 'no-such-lesson'], finale: null, mutun: null }],
      lessons: { izhar: { closing: null, contrastWith: 'no-such-lesson', notice: null } },
    }, id => !!getLesson(id))
    expect(c.units[0]).toMatchObject({ lessonIds: ['izhar'], finale: null, mutun: [] })
    expect(c.lesson('izhar')).toEqual({ closing: null, contrastWith: null, notice: null })
    expect(c.lesson('unknown')).toEqual({ closing: null, contrastWith: null, notice: null })
  })
  it('loads the real course: units in order, every course lesson exists', () => {
    expect(units.map(u => u.n)).toEqual(units.map((_, i) => i))
    expect(courseOrder.every(id => getLesson(id))).toBe(true)
    expect(new Set(courseOrder).size).toBe(courseOrder.length)
    expect(courseLesson(courseOrder[0])).toHaveProperty('closing')
  })
})
