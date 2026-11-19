// v2 course progress (spec §4). Pure: a lesson is done when introduced; a unit opens when the previous unit's
// finale is done. A unit without a finale counts its finale as done once its lessons are (or once one is recorded).
import type { Unit, UserData } from './types'

export type CourseNext =
  | { kind: 'lesson'; id: string; unit: Unit }
  | { kind: 'finale'; unit: Unit }
  | { kind: 'done' }

type Progress = Pick<UserData, 'introductions' | 'finales'>

export function courseProgress(d: Progress, units: Unit[]) {
  const done = new Set(d.introductions.map(i => i.lessonId))
  const finales = new Set(d.finales.map(f => f.unitId))
  const lessonsDone = (u: Unit) => u.lessonIds.every(id => done.has(id))
  const finaleDone = (u: Unit) => finales.has(u.id) || (!u.finale && lessonsDone(u))
  const open = (u: Unit) => {
    const i = units.indexOf(u)
    return i <= 0 || finaleDone(units[i - 1])
  }
  let next: CourseNext = { kind: 'done' }
  for (const u of units) {
    // a unit with its finale recorded is passed: its open lessons (new in v2, for migrated data) are catch-up, never the frontier
    if (!open(u) || finales.has(u.id)) continue
    const id = u.lessonIds.find(x => !done.has(x))
    if (id) { next = { kind: 'lesson', id, unit: u }; break }
    if (!finaleDone(u)) { next = { kind: 'finale', unit: u }; break }
  }
  /** A lesson not done in a passed unit (v1 learners: the lessons v2 added to units they had finished). */
  const catchUp = (lessonId: string) => !done.has(lessonId) && units.some(u => finales.has(u.id) && u.lessonIds.includes(lessonId))
  /** Lessons can be started when done (replay), next in the course, or catch-up. */
  const unlocked = (lessonId: string) => done.has(lessonId) || (next.kind === 'lesson' && next.id === lessonId) || catchUp(lessonId)
  return { done, lessonsDone, finaleDone, open, next, unlocked, catchUp }
}

/** The 49 lesson ids of v1 (content/rules.json minus the 9 lessons v2 added). */
export const V1_LESSONS = new Set([
  'ibtida', 'makharij-jawf', 'makharij-halq', 'makharij-aqsa', 'makharij-wasat', 'makharij-taraf', 'makharij-shafatan',
  'sifat-hams', 'sifat-shidda', 'sifat-istila', 'sifat-safir', 'sifat-inhiraf', 'izhar', 'idgh-g', 'idgh-n', 'iqlab', 'ikhfa',
  'm-ikhfa', 'm-idgham', 'm-izhar', 'ghunnah', 'lam-q', 'lam-s', 'lam-jh', 'lam-jl', 'ra-h', 'ra-l', 'qal-s', 'qal-k', 'tabii',
  'iwad', 'silah-s', 'badal', 'muttasil', 'munfasil', 'silah-k', 'arid', 'lin', 'lazim-k', 'lazim-h', 'mithlayn',
  'mutajanisayn', 'mutaqaribayn', 'waqf-signs', 'waqf-how', 'sakt', 'imalah', 'ishmam', 'tashil',
])

/**
 * v1 → v2 migration (engineering review M4): a unit is passed when every lesson of it that existed in v1 is done.
 * A unit with no v1 lessons (basics, الفاتحة) is passed when the next unit that has some is. Lessons v2 added to a
 * passed unit stay open as catch-up (courseProgress) and never lock the units after it.
 */
export function migratedFinales(introductions: Progress['introductions'], units: Unit[]): UserData['finales'] {
  const on = new Map(introductions.map(i => [i.lessonId, i.on]))
  const out: UserData['finales'] = []
  let after: string | null = null // day the next unit with v1 lessons was passed, null if it was not
  for (const u of [...units].reverse()) {
    const v1 = u.lessonIds.filter(id => V1_LESSONS.has(id))
    const day: string | null = v1.length ? (v1.every(id => on.has(id)) ? v1.map(id => on.get(id)!).sort().pop()! : null) : after
    if (v1.length) after = day
    if (day) out.unshift({ unitId: u.id, on: day })
  }
  return out
}
