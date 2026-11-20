// In Arabic, the adapters merge content/ar.json over the English fields.
vi.mock('../i18n', () => ({ isAr: true, pick: <T,>(en: T, ar: T | undefined | null) => (ar != null && ar !== '' ? ar : en) }))
import { AR_CONTENT as A, getLesson, mutun, pairs, topics } from './index'
import { courseLesson, getUnit } from './course'

test('Arabic overlay is merged', () => {
  const l = getLesson('ibtida')!
  expect(l.summary).toBe(A.lessons.ibtida!.definition)
  expect(l.facts[0].prompt).toBe(A.lessons.ibtida!.facts![0].q)
  expect(l.facts[0].options).toEqual(A.lessons.ibtida!.facts![0].options)
  expect(getLesson('ikhfa')!.counts!.note).toBe(A.lessons.ikhfa!.countsNote)
  expect(topics[0].intro).toBe(A.topics.found!.intro)
  expect(getUnit('u1')!.intro).toBe(A.units.u1!.intro)
  expect(getUnit('u1')!.mutun[0].note).toBe(A.units.u1!.mutun![0])
  expect(courseLesson('tabii').notice).toBe(A.course.tabii!.notice)
  expect(pairs[0].hint).toBe(A.pairs[pairs[0].id])
  expect(mutun[0].gloss).toBe(A.mutun['tuhfa-1'])
})
