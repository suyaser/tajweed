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
  it('skips done lessons of a later open unit only after the earlier ones (migrated data)', () => {
    // v1 learner: u1 lesson b missing (new in v2), u3 done with its finale migrated
    const p = courseProgress({ introductions: intro('c', 'd'), finales: migratedFinales(intro('c', 'd'), U) }, U)
    expect(p.next).toMatchObject({ kind: 'lesson', id: 'a' })
    expect(migratedFinales(intro('c', 'd'), U)).toEqual([{ unitId: 'u3', on: '2026-11-01' }]) // not u2: no lessons
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
