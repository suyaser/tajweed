import { describe, expect, it } from 'vitest'
import type { Example, Lesson } from './types'
import { distractors, makeQuestion, seeded } from './questions'

const ex = (lessonId: string, n: number): Example => ({
  id: `${lessonId}#${n}`, lessonId, verseKey: '1:1', wordFrom: 1, wordTo: 1, text: 'x', focus: 'x', stopping: n === 2,
})
const L = (id: string, topicId: string, confusableWith: string[] = [], over: Partial<Lesson> = {}): Lesson => ({
  id, topicId, phaseId: 3, order: 0, nameAr: id, nameEn: id, colour: 'clear', summary: `${id} summary`,
  examples: [1, 2, 3].map(n => ex(id, n)), facts: [], questionKinds: ['identify'], confusableWith, sources: [],
  review: { status: 'verified' }, ...over,
})
const lessons = [
  L('ikhfa', 'nun', ['idgh-g', 'iqlab']), L('idgh-g', 'nun', ['ikhfa']), L('iqlab', 'nun', ['ikhfa']), L('izhar', 'nun'),
  L('idgh-n', 'nun'), L('m-izhar', 'meem'), L('lam-q', 'lam'),
  L('munfasil', 'madd', [], { counts: { min: 4, max: 5 }, questionKinds: ['identify', 'length'] }),
  L('arid', 'madd', [], { counts: { min: 2, max: 6 }, questionKinds: ['identify', 'length'] }),
  L('makharij', 'found', [], { examples: [], questionKinds: ['fact'], facts: [1, 2].map(n => ({ id: `makharij?${n}`, lessonId: 'makharij', prompt: `q${n}`, options: ['a', 'b', 'c', 'd'], answer: 1, explanation: 'why' })) }),
]
const ctx = (introduced: string[], seed = 1) => ({ lessons, introduced, munfasilLength: 4 as const, rng: seeded(seed) })

describe('identify', () => {
  it('picks partners, then same topic, then any; only introduced', () => {
    const all = lessons.map(l => l.id)
    for (let s = 1; s < 20; s++) {
      const ds = distractors(lessons[0], ctx(all, s), seeded(s)).map(l => l.id)
      expect(ds.slice(0, 2).sort()).toEqual(['idgh-g', 'iqlab'])
      expect(['izhar', 'idgh-n']).toContain(ds[2])
    }
    const ds = distractors(lessons[0], ctx(['ikhfa', 'iqlab', 'm-izhar', 'lam-q']), seeded(3)).map(l => l.id)
    expect(ds[0]).toBe('iqlab')
    expect(ds.slice(1).sort()).toEqual(['lam-q', 'm-izhar'])
  })
  it('fills from non-introduced lessons when too few are introduced (first lessons)', () => {
    const q = makeQuestion({ refId: 'ikhfa' }, { ...ctx([]), pretest: true })!
    expect(q.options).toHaveLength(4)
    expect(q.options.map(o => o.id)).toContain('ikhfa')
    expect(q.options.map(o => o.id)).not.toContain('makharij') // fact lessons are not identify options
  })
  it('never repeats the last example, honours excludes, and is deterministic', () => {
    for (let s = 1; s < 50; s++) {
      const q = makeQuestion({ refId: 'ikhfa', lastExampleId: 'ikhfa#1' }, ctx(['ikhfa'], s))!
      expect(q.exampleId).not.toBe('ikhfa#1')
      const q2 = makeQuestion({ refId: 'ikhfa', lastExampleId: 'ikhfa#1' }, { ...ctx(['ikhfa'], s), excludeExampleIds: ['ikhfa#2'] })!
      expect(q2.exampleId).toBe('ikhfa#3')
    }
    expect(makeQuestion({ refId: 'ikhfa' }, ctx(['ikhfa'], 7))).toEqual(makeQuestion({ refId: 'ikhfa' }, ctx(['ikhfa'], 7)))
  })
  it('flags stopping examples', () => {
    const q = makeQuestion({ refId: 'ikhfa', lastExampleId: 'ikhfa#1' }, { ...ctx([]), excludeExampleIds: ['ikhfa#3'] })!
    expect(q).toMatchObject({ exampleId: 'ikhfa#2', stopping: true })
  })
})

describe('length', () => {
  it('alternates with identify and maps counts', () => {
    expect(makeQuestion({ refId: 'arid', reps: 0 }, ctx(['arid']))!.kind).toBe('identify')
    const q = makeQuestion({ refId: 'arid', reps: 1 }, ctx(['arid']))!
    expect(q).toMatchObject({ kind: 'length', answerId: '246' })
    expect(q.options.map(o => o.id)).toEqual(['2', '45', '246', '6'])
  })
  it('uses the chosen munfasil length', () => {
    const q4 = makeQuestion({ refId: 'munfasil' }, { ...ctx([]), kind: 'length' })!
    expect(q4.options.find(o => o.id === q4.answerId)!.labelEn).toBe('4')
    expect(q4.explanation).toContain('5 is also correct')
    const q5 = makeQuestion({ refId: 'munfasil' }, { ...ctx([]), kind: 'length', munfasilLength: 5 })!
    expect(q5.options.find(o => o.id === q5.answerId)!.labelEn).toBe('5')
  })
})

describe('fact', () => {
  it('asks authored questions, not the last one', () => {
    const q = makeQuestion({ refId: 'makharij', lastExampleId: 'makharij?1' }, ctx([]))!
    expect(q).toMatchObject({ kind: 'fact', exampleId: 'makharij?2', answerId: '1', prompt: 'q2' })
  })
})
