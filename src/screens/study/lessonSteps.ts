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
