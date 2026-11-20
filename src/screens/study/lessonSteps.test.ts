import { beforeEach, expect, it } from 'vitest'
import { checkScore, completeStep, freshSteps, getSteps, missingSteps, saveSteps, scoreCheck, visitStep } from './lessonSteps'

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

it('remembers whether Find exists, with the steps', () => {
  saveSteps('basics', { ...freshSteps('hear', D), find: false })
  saveSteps('ikhfa', { ...freshSteps('hear', D), find: true })
  expect(getSteps('basics')?.find).toBe(false)
  expect(getSteps('ikhfa')?.find).toBe(true)
  // visiting and completing steps keep the answer
  const s = completeStep(visitStep(getSteps('basics')!, 'learn', D), 'learn', D)
  expect(s.find).toBe(false)
})

it('keeps the Check score until a full new pass replaces it', () => {
  let s = scoreCheck(freshSteps('check', D), [true, false, true], D)
  expect(s.done).toContain('check')
  saveSteps('tabii', s)
  // reopening Check (a visit) and finishing the lesson keep the score
  s = visitStep(getSteps('tabii')!, 'check', D)
  s = { ...completeStep(s, 'recite', D), current: 'hear' }
  expect(checkScore(s)).toEqual({ n: 2, m: 3 })
  s = scoreCheck(s, [true, true, true], D)
  expect(checkScore(s)).toEqual({ n: 3, m: 3 })
  expect(checkScore(freshSteps('hear', D))).toEqual({ n: 0, m: 0 })
})
