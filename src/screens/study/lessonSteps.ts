// Per-lesson step state (docs/10-lesson-ux.md "Step bar"): which steps were completed and visited, and where the
// learner is. Device-local convenience (localStorage), like the v1 resume memory; never schedule state.
import type { Day } from '../../core/types'

export const STEP_IDS = ['hear', 'notice', 'learn', 'say', 'find', 'check', 'recite'] as const
export type StepId = (typeof STEP_IDS)[number]
export interface LessonSteps { done: StepId[]; visited: StepId[]; current: StepId; on: Day }

const KEY = 'tajweed-path:lesson-steps'
type All = Record<string, LessonSteps>

function readAll(): All {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as All } catch { return {} }
}
export const getSteps = (lessonId: string): LessonSteps | undefined => readAll()[lessonId]

export function saveSteps(lessonId: string, s: LessonSteps) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [lessonId]: s })) } catch { /* storage blocked */ }
}
export function clearSteps(lessonId: string) {
  const all = readAll()
  delete all[lessonId]
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* storage blocked */ }
}

/** Steps a lesson can't be finished without (when the lesson has them). Notice and Find are recommended only. */
export const REQUIRED: readonly StepId[] = ['hear', 'learn', 'say', 'check', 'recite']

export const freshSteps = (current: StepId, on: Day): LessonSteps => ({ done: [], visited: [current], current, on })
const add = (xs: StepId[], id: StepId) => (xs.includes(id) ? xs : [...xs, id])

/** Open a step: it becomes current and visited, never done. */
export const visitStep = (s: LessonSteps, id: StepId, on: Day): LessonSteps => ({ ...s, visited: add(s.visited, id), current: id, on })

/** A step's minimum was met (docs/10 §3.1 "Done means completed"). */
export const completeStep = (s: LessonSteps, id: StepId, on: Day): LessonSteps =>
  s.done.includes(id) ? s : { ...s, done: add(s.done, id), visited: add(s.visited, id), on }

/** Required steps, in order, that exist for this lesson and aren't done; `except` is the step finishing now. */
export const missingSteps = (s: LessonSteps, exists: (id: StepId) => boolean, except?: StepId): StepId[] =>
  REQUIRED.filter(id => id !== except && exists(id) && !s.done.includes(id))
