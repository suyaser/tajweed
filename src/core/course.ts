// v2 course progress (spec §4). Pure: a lesson is done when introduced; a unit opens when the previous unit's
// finale is done. A unit without a finale counts its finale as done once its lessons are.
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
  const finaleDone = (u: Unit) => (u.finale ? finales.has(u.id) : lessonsDone(u))
  const open = (u: Unit) => {
    const i = units.indexOf(u)
    return i <= 0 || finaleDone(units[i - 1])
  }
  let next: CourseNext = { kind: 'done' }
  for (const u of units) {
    if (!open(u)) continue
    const id = u.lessonIds.find(x => !done.has(x))
    if (id) { next = { kind: 'lesson', id, unit: u }; break }
    if (!finaleDone(u)) { next = { kind: 'finale', unit: u }; break }
  }
  /** Lessons can be started when done (replay) or next in the course. */
  const unlocked = (lessonId: string) => done.has(lessonId) || (next.kind === 'lesson' && next.id === lessonId)
  return { done, lessonsDone, finaleDone, open, next, unlocked }
}

/** v1 → v2 migration: units whose (non-empty) lessons were all introduced get their finale marked done. */
export function migratedFinales(introductions: Progress['introductions'], units: Unit[]): UserData['finales'] {
  const on = new Map(introductions.map(i => [i.lessonId, i.on]))
  return units
    .filter(u => u.finale && u.lessonIds.length && u.lessonIds.every(id => on.has(id)))
    .map(u => ({ unitId: u.id, on: u.lessonIds.map(id => on.get(id)!).sort().pop()! }))
}
