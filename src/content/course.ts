// Adapts content/course.json (spec §2) to typed units and per-lesson course data.
import type { CourseLesson, MatnLine, Unit } from '../core/types'
import rawCourse from '../../content/course.json'
import { AR_CONTENT, getLesson, mutun } from './index'
import { isAr, pick } from '../i18n'

export interface RawCourse {
  units: (Omit<Unit, 'lessonIds' | 'mutun'> & { lessons: string[]; mutun?: Unit['mutun'] | null })[]
  lessons: Record<string, Partial<CourseLesson> | undefined>
}

const NONE: CourseLesson = { closing: null, contrastWith: null, notice: null }

/** Units with only the lesson ids `has` knows (rules.json may lag behind course.json); nulls kept as null. */
export function buildCourse(raw: RawCourse, has: (lessonId: string) => boolean) {
  const units: Unit[] = raw.units.map(({ lessons, mutun, ...u }) => {
    const a = AR_CONTENT.units[u.id]
    return {
      ...u, nameEn: pick(u.nameEn, a?.name), intro: pick(u.intro, a?.intro), finale: u.finale ?? null, lessonIds: lessons.filter(has),
      mutun: isAr ? (mutun ?? []).map((m, i) => ({ ...m, note: pick(m.note, a?.mutun?.[i]) })) : mutun ?? [],
    }
  })
  // one object per id, so it is stable as an effect dependency (engineering minor 8)
  const cache = new Map<string, CourseLesson>()
  const lesson = (id: string): CourseLesson => {
    if (!cache.has(id)) {
      const l = raw.lessons[id]
      cache.set(id, { ...NONE, ...l, notice: pick(l?.notice ?? null, AR_CONTENT.course[id]?.notice), contrastWith: l?.contrastWith && has(l.contrastWith) ? l.contrastWith : null })
    }
    return cache.get(id)!
  }
  return { units, lesson }
}

const course = buildCourse(rawCourse as unknown as RawCourse, id => !!getLesson(id))
export const units = course.units
export const courseLesson = course.lesson
/** Every lesson id in course order. */
export const courseOrder = units.flatMap(u => u.lessonIds)
export const getUnit = (id: string) => units.find(u => u.id === id)
export const unitOf = (lessonId: string) => units.find(u => u.lessonIds.includes(lessonId))
/** The unit's mutun lines (تحفة الأطفال / الجزرية), in order. */
export const unitMutun = (u: Unit): MatnLine[] =>
  u.mutun.flatMap(m => mutun.filter(l => l.matn === m.matn && l.n >= m.from && l.n <= m.to))
