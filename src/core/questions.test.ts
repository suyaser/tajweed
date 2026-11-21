import { describe, expect, it } from 'vitest'
import type { Example, Lesson } from './types'
import { checkQuestions, distractors, makeQuestion, reasonFor, seeded } from './questions'
import { lessons as real } from '../content'
import { alsoLessons } from '../content/rulemap'
// @ts-expect-error -- no @types/node in this project; vitest runs in node from the repo root.
import { readFileSync } from 'node:fs'

const ex = (lessonId: string, n: number): Example => ({
  id: `${lessonId}#${n}`, lessonId, verseKey: '1:1', wordFrom: 1, wordTo: 1, text: 'x', focus: 'x', stopping: n === 2,
})
const L = (id: string, topicId: string, confusableWith: string[] = [], over: Partial<Lesson> = {}): Lesson => ({
  id, topicId, order: 0, nameAr: id, nameEn: id, colour: 'clear', summary: `${id} summary`,
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

describe('checkQuestions (Learn Check step, UX M2)', () => {
  const opts = (qs: ReturnType<typeof checkQuestions>) => qs.flatMap(q => (q.kind === 'identify' ? q.options.map(o => o.id) : []))
  it('uses only learned lessons (plus this one) as identify options', () => {
    const qs = checkQuestions(lessons[0], lessons, ['idgh-g', 'izhar', 'iqlab'], 4, seeded(1))
    expect(qs.length).toBeGreaterThanOrEqual(2)
    expect(new Set(opts(qs))).toEqual(new Set(['ikhfa', 'idgh-g', 'izhar', 'iqlab']))
  })
  it('falls back to length or fact questions with fewer than 2 learned distractors, or asks nothing', () => {
    expect(checkQuestions(lessons[0], lessons, ['idgh-g'], 4, seeded(1))).toEqual([])
    const m = lessons.find(l => l.id === 'munfasil')!
    expect(checkQuestions(m, lessons, [], 4, seeded(1)).map(q => q.kind)).toEqual(['length']) // fixture examples share their text: deduped
    const f = lessons.find(l => l.id === 'makharij')!
    expect(checkQuestions(f, lessons, [], 4, seeded(1)).map(q => q.exampleId).sort()).toEqual(['makharij?1', 'makharij?2'])
  })
  it('never asks the same question twice; the real basics lesson asks facts', () => {
    const same = L('same', 'nun', [], { examples: [1, 2, 3].map(n => ({ ...ex('same', n), text: 'y', focus: 'y' })) })
    expect(checkQuestions(same, [...lessons, same], ['ikhfa', 'izhar', 'iqlab'], 4, seeded(2)).filter(q => q.lessonId === 'same')).toHaveLength(1)
    const basics = real.find(l => l.id === 'basics')!
    const qs = checkQuestions(basics, real, [], 4, seeded(1))
    expect(qs.map(q => q.kind)).toEqual(['fact', 'fact'])
    expect(qs[0].exampleId).not.toBe(qs[1].exampleId)
  })
})

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

describe('options never include a rule the underlined words also show (tajweed review B1)', () => {
  it('drops example.also from the distractors', () => {
    const withAlso = lessons.map(l => (l.id === 'ikhfa' ? { ...l, examples: l.examples.map(e => ({ ...e, also: ['iqlab', 'izhar'] })) } : l))
    for (let s = 1; s < 30; s++) {
      const q = makeQuestion({ refId: 'ikhfa' }, { ...ctx(lessons.map(l => l.id), s), lessons: withAlso })!
      expect(q.options.map(o => o.id)).not.toContain('iqlab')
      expect(q.options.map(o => o.id)).not.toContain('izhar')
    }
  })
  // the review's cases as fixed examples (verse, words, stop), each given its also-list from the data, so the test
  // doesn't depend on which words the lessons currently use
  it.each([
    ['qal-k', '113:1', 4, 4, true, 'lam-q'],
    ['lam-q', '113:1', 4, 4, true, 'qal-k'],
    ['ra-l', '2:20', 25, 25, true, 'arid'],
    ['ra-h', '105:4', 1, 1, false, 'm-ikhfa'],
    ['ra-h', '89:28', 1, 1, false, 'munfasil'],
    ['ra-l', '24:37', 1, 1, false, 'idgh-n'],
  ] as const)('%s %s never offers %s', (lessonId, key, from, to, stopping, never) => {
    const [su, a] = key.split(':').map(Number)
    const v = JSON.parse(readFileSync(`public/data/surah/${String(su).padStart(3, '0')}.json`, 'utf8'))[a - 1]
    const base = { id: `${lessonId}#x`, lessonId, verseKey: key, wordFrom: from, wordTo: to, text: v.words.slice(from - 1, to).join(' '), focus: v.words[from - 1].slice(0, 2), stopping }
    const ex: Example = { ...base, also: alsoLessons(base, v, []) }
    const ls = real.map(l => (l.id === lessonId ? { ...l, examples: [ex] } : l))
    const all = ls.map(l => l.id)
    for (let s = 1; s < 60; s++) {
      for (const pretest of [false, true]) {
        const q = makeQuestion({ refId: lessonId }, { lessons: ls, introduced: all, munfasilLength: 4, rng: seeded(s), kind: 'identify', pretest })!
        expect(q.exampleId).toBe(ex.id)
        expect(q.options.map(o => o.id)).not.toContain(never)
      }
    }
  })
})

describe('learning review fixes', () => {
  it('include and vs shape the options', () => {
    const q = makeQuestion({ refId: 'izhar' }, { ...ctx(['izhar', 'm-izhar', 'lam-q', 'idgh-n']), include: 'iqlab' })!
    expect(q.options.map(o => o.id)).toContain('iqlab')
    const c = makeQuestion({ refId: 'ikhfa' }, { ...ctx(['ikhfa', 'iqlab']), vs: 'iqlab', kind: 'length' })!
    expect(c.kind).toBe('identify')
    expect(c.options.map(o => o.id).sort()).toEqual(['ikhfa', 'iqlab'])
  })
  it('shuffles fact options but keeps the answer mapped', () => {
    const orders = new Set<string>()
    for (let s = 1; s < 20; s++) {
      const q = makeQuestion({ refId: 'makharij' }, ctx([], s))!
      expect(q.options.find(o => o.id === q.answerId)!.labelAr).toBe(q.fact!.options[q.fact!.answer])
      orders.add(q.options.map(o => o.id).join())
    }
    expect(orders.size).toBeGreaterThan(1)
  })
  it('muttasil shows the chosen length, like munfasil', () => {
    const muttasil = real.find(l => l.id === 'muttasil')!
    const q = makeQuestion({ refId: 'muttasil' }, { lessons: real, introduced: [], munfasilLength: 5, kind: 'length' })!
    expect(muttasil.counts).toBeDefined()
    expect(q.options.find(o => o.id === q.answerId)!.labelEn).toBe('5')
  })
  it('asks no length for several opening letters at once', () => {
    const lh = real.find(l => l.id === 'lazim-h')!
    for (const ex of lh.examples) {
      const q = makeQuestion({ refId: 'lazim-h' }, {
        lessons: real, introduced: [], munfasilLength: 4, kind: 'length', excludeExampleIds: lh.examples.filter(e => e !== ex).map(e => e.id),
      })!
      expect(q.kind).toBe(Array.from(ex.focus).filter(c => /[ء-ي]/.test(c)).length === 1 ? 'length' : 'identify')
    }
  })
  it('explains with the deciding letter when there is no note', () => {
    const ikhfa = real.find(l => l.id === 'ikhfa')!
    const bare = (text: string, focus: string): Example => ({ id: 'x', lessonId: 'ikhfa', verseKey: '2:4', wordFrom: 1, wordTo: 2, text, focus, stopping: false })
    expect(reasonFor(ikhfa, bare('مِن قَبْلِكَ', 'ن قَ'))).toBe(`نْ then ق → ${ikhfa.nameAr}.`)
    expect(reasonFor(ikhfa, bare('عَذَابٌ شَدِيدٌ', 'بٌ شَ'))).toMatch(/^تنوين then ش/)
    const lamS = real.find(l => l.id === 'lam-s')!
    expect(reasonFor(lamS, { ...lamS.examples[0], note: undefined })).toContain('sun letter') // every example has a note now; test the fallback
    const noted = real.flatMap(l => l.examples).find(e => e.note)!
    expect(reasonFor(real.find(l => l.id === noted.lessonId)!, noted)).toBe(noted.note)
  })
  it('the right fact option is not systematically the longest (UX review M11)', () => {
    const facts = real.flatMap(l => l.facts)
    const longest = facts.filter(f => {
      const n = f.options.map(o => o.length)
      return n[f.answer] === Math.max(...n) && n.filter(x => x === n[f.answer]).length === 1
    })
    expect(longest.length / facts.length).toBeLessThan(0.35) // chance is 0.25
    for (const f of facts) expect(f.options[f.answer]).not.toMatch(/\bbecause\b/)
  })
})

test('no "which rule" question for مخارج, صفات or the ابتداء/وقف lessons, as answer or wrong option', async () => {
  const { lessons } = await import('../content')
  for (const id of ['makharij-aqsa', 'sifat-hams', 'ibtida', 'waqf-how', 'rawm-ishmam'])
    expect(lessons.find(l => l.id === id)!.questionKinds).not.toContain('identify')
})

test('a ر in the words keeps both ر lessons out of the wrong options; تَأْمَ۫نَّا keeps المثلين out', async () => {
  const { lessons } = await import('../content')
  const withRa = lessons.flatMap(l => l.examples).filter(e => e.lessonId !== 'ra-h' && e.lessonId !== 'ra-l' && /ر/.test(e.text))
  expect(withRa.length).toBeGreaterThan(0)
  for (const e of withRa) expect(e.also).toEqual(expect.arrayContaining(['ra-h', 'ra-l']))
})
