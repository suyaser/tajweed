import { beforeEach, expect, it } from 'vitest'
import { completeStep, freshSteps, getSteps, missingSteps, saveSteps, visitStep } from './lessonSteps'

const D = '2026-11-20'
const all = () => true
beforeEach(() => localStorage.clear())

it('visiting is not doing', () => {
  let s = freshSteps('hear', D)
  s = visitStep(s, 'learn', D)
  expect(s.current).toBe('learn')
  expect(s.visited).toEqual(['hear', 'learn'])
  expect(s.done).toEqual([])
  s = completeStep(s, 'learn', D)
  s = completeStep(s, 'learn', D)
  expect(s.done).toEqual(['learn'])
})

it('gates finishing on the required steps that exist', () => {
  let s = freshSteps('hear', D)
  for (const id of ['hear', 'notice', 'learn', 'find'] as const) s = completeStep(s, id, D)
  expect(missingSteps(s, all, 'recite')).toEqual(['say', 'check'])
  // a lesson without questions doesn't need Check; Notice and Find are never required
  expect(missingSteps(s, id => id !== 'check', 'recite')).toEqual(['say'])
  s = completeStep(completeStep(s, 'say', D), 'check', D)
  expect(missingSteps(s, all, 'recite')).toEqual([])
  expect(missingSteps(s, all)).toEqual(['recite'])
})

it('persists per lesson', () => {
  const s = completeStep(freshSteps('hear', D), 'hear', D)
  saveSteps('tabii', s)
  expect(getSteps('tabii')).toEqual(s)
  expect(getSteps('ikhfa')).toBeUndefined()
})
