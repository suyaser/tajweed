// Spec §6.4: identify · length · fact.
import type { Example, FactQuestion, Lesson, QuestionKind } from './types'

export interface Option { id: string; labelAr: string; labelEn: string }

export interface Question {
  kind: QuestionKind
  lessonId: string
  exampleId: string // example or fact id; log it as Attempt.exampleId
  example?: Example
  fact?: FactQuestion
  prompt: string
  options: Option[]
  answerId: string // a lesson id (identify), a length id (length), an option index (fact)
  stopping?: boolean
  explanation: string
}

export interface QuestionCtx {
  lessons: Lesson[]
  introduced: Iterable<string> // lesson ids already introduced
  munfasilLength: 4 | 5
  rng?: () => number // inject a seeded one for determinism
  kind?: QuestionKind // force a kind (e.g. learn steps)
  pretest?: boolean
  excludeExampleIds?: string[] // e.g. examples already used in the lesson's pretest
  include?: string // a lesson id that must be among the options (Learn's discrimination check)
  vs?: string // contrast: exactly two options, this lesson and `vs` (relearn after a confusion)
}

/** Small seeded PRNG (mulberry32). */
export function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const shuffle = <T>(a: T[], rng: () => number): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

/** Never the last one; avoid `exclude` when possible; reuse only if the pool is that small. */
function pick<T extends { id: string }>(pool: T[], last: string | null | undefined, exclude: string[], rng: () => number): T | undefined {
  const notLast = pool.filter(x => x.id !== last)
  const fresh = notLast.filter(x => !exclude.includes(x.id))
  const from = fresh.length ? fresh : notLast.length ? notLast : pool
  return from[Math.floor(rng() * from.length)]
}

export const LENGTHS = [
  { id: '2', labelAr: '٢', labelEn: '2' },
  { id: '45', labelAr: '٤ أو ٥', labelEn: '4 or 5' },
  { id: '246', labelAr: '٢ أو ٤ أو ٦', labelEn: '2, 4 or 6' },
  { id: '6', labelAr: '٦', labelEn: '6' },
]
// Read at the same length in حفص من الشاطبية (review: المتصل = المنفصل); الصلة الكبرى follows the المنفصل.
const MUNFASIL_LIKE = ['munfasil', 'muttasil', 'silah-k']
const lengthId = ({ min, max }: { min: number; max: number }) => (min === max ? String(min) : min === 2 && max === 6 ? '246' : '45')
const letters = (s: string) => Array.from(s).filter(c => /[ء-غف-ي]/.test(c))

/** A length question needs one مد under the underline: not several opening letters at once (كٓهيعٓصٓ). */
const lengthOk = (lesson: Lesson, ex: Example) => lesson.id !== 'lazim-h' || letters(ex.focus).length === 1

/** The deciding reason for one example (design §8.2): its own note, else a line built from the rule and the letter. */
export function reasonFor(lesson: Lesson, ex: Example): string {
  if (ex.note) return ex.note
  const ls = letters(ex.focus)
  const L = ls[ls.length - 1] // the letter after نْ / مْ / ال is the last one underlined
  const name = lesson.nameAr
  if (L) {
    if (lesson.topicId === 'nun') return `${/[ً-ٍ]/.test(ex.focus) ? 'تنوين' : 'نْ'} then ${L} → ${name}.`
    if (lesson.topicId === 'meem') return `مْ then ${L} → ${name}.`
    if (lesson.id === 'lam-q') return `ال then ${L}, a moon letter: the ل is said → ${name}.`
    if (lesson.id === 'lam-s') return `ال then ${L}, a sun letter: the ل merges into it → ${name}.`
    if (lesson.id === 'qal-s') return `${ls[0]} with سكون → ${name}.`
    if (lesson.id === 'qal-k') return `Stopping on ${L} → ${name}.`
    if (lesson.id === 'ghunnah') return `${ls[0]} with شدة: hold the غنة 2 counts → ${name}.`
  }
  if (lesson.counts) {
    const { min, max, note } = lesson.counts
    return `${name}: ${min === max ? min : `${min}–${max}`} counts. ${note ?? lesson.summary}`
  }
  return lesson.summary
}

/** Distractors in order: confusable partners → same topic → any; within a tier, random. Never a lesson the words also show. */
export function distractors(lesson: Lesson, ctx: QuestionCtx, rng: () => number, example?: Example): Lesson[] {
  const allowed = new Set(ctx.introduced)
  const also = new Set(example?.also ?? [])
  const pool = ctx.lessons.filter(l => l.id !== lesson.id && l.questionKinds.includes('identify') && !also.has(l.id))
  if (ctx.vs) return pool.filter(l => l.id === ctx.vs)
  const tiers = [
    pool.filter(l => lesson.confusableWith.includes(l.id)),
    pool.filter(l => !lesson.confusableWith.includes(l.id) && l.topicId === lesson.topicId),
    pool.filter(l => !lesson.confusableWith.includes(l.id) && l.topicId !== lesson.topicId),
  ].map(t => shuffle(t, rng))
  const ordered = tiers.flat()
  const out = ordered.filter(l => l.id === ctx.include)
  // pretest: one unfamiliar same-topic name besides the answer, so "the one I don't know" is not a giveaway (learning B1)
  if (ctx.pretest) out.push(...ordered.filter(l => !allowed.has(l.id) && l.topicId === lesson.topicId && !out.includes(l)).slice(0, 1))
  for (const l of ordered) if (out.length < 3 && allowed.has(l.id) && !out.includes(l)) out.push(l)
  // ponytail: early on too few lessons are introduced; fill from the rest so there are always 4 options
  for (const l of ordered) if (out.length < 3 && !out.includes(l)) out.push(l)
  return out
}

export function makeQuestion(
  item: { refId: string; lastExampleId?: string | null; reps?: number },
  ctx: QuestionCtx,
): Question | null {
  const rng = ctx.rng ?? Math.random
  const lesson = ctx.lessons.find(l => l.id === item.refId)
  if (!lesson || !lesson.questionKinds.length) return null
  const kinds = lesson.questionKinds
  const both = kinds.includes('identify') && kinds.includes('length')
  let kind: QuestionKind =
    ctx.vs ? 'identify'
      : ctx.kind && kinds.includes(ctx.kind) ? ctx.kind : both ? ((item.reps ?? 0) % 2 ? 'length' : 'identify') : kinds[0]
  const exclude = ctx.excludeExampleIds ?? []

  if (kind === 'fact') {
    const fact = pick(lesson.facts, item.lastExampleId, exclude, rng)
    if (!fact) return null
    // option ids stay the authored index, so the answer mapping survives the shuffle
    const options = shuffle(fact.options.map((o, i) => ({ id: String(i), labelAr: o, labelEn: o })), rng)
    return {
      kind, lessonId: lesson.id, exampleId: fact.id, fact, prompt: fact.prompt,
      options, answerId: String(fact.answer), explanation: fact.explanation,
    }
  }

  const example = pick(lesson.examples, item.lastExampleId, exclude, rng)
  if (!example) return null
  const base = { lessonId: lesson.id, exampleId: example.id, example, stopping: example.stopping }
  if (kind === 'length' && !lengthOk(lesson, example)) kind = 'identify'

  if (kind === 'length' && lesson.counts) {
    const n = ctx.munfasilLength
    const munfasil = MUNFASIL_LIKE.includes(lesson.id)
    const options = LENGTHS.map(o => (munfasil && o.id === '45' ? { id: o.id, labelAr: n === 4 ? '٤' : '٥', labelEn: String(n) } : o))
    const answer = options.find(o => o.id === lengthId(lesson.counts!))!
    const why = example.note ?? lesson.counts.note ?? lesson.summary
    const explanation = munfasil
      ? `It's ${n} counts, the length you chose for المنفصل; المتصل is read the same. ${n === 4 ? 5 : 4} is also correct for حفص من طريق الشاطبية; keep one length throughout.${lesson.id === 'muttasil' ? ' 6 is also allowed when you stop on a final همزة.' : ''} ${why}`
      : `It's ${answer.labelEn} counts: ${why}`
    return { ...base, kind, prompt: 'How many counts on the underlined مد?', options, answerId: answer.id, explanation }
  }

  const options = shuffle([lesson, ...distractors(lesson, ctx, rng, example)], rng).map(l => ({ id: l.id, labelAr: l.nameAr, labelEn: l.nameEn }))
  return {
    ...base, kind: 'identify', prompt: ctx.vs ? 'Which of the two is the underlined part?' : 'Which rule is the underlined part?',
    options, answerId: lesson.id, explanation: reasonFor(lesson, example),
  }
}
