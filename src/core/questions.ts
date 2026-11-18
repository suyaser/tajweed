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

const shuffle = <T>(a: T[], rng: () => number): T[] => {
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
  { id: '246', labelAr: '٢ · ٤ · ٦', labelEn: '2·4·6' },
  { id: '6', labelAr: '٦', labelEn: '6' },
]
const MUNFASIL_LIKE = ['munfasil', 'silah-k'] // الصلة الكبرى follows the المنفصل length
const lengthId = ({ min, max }: { min: number; max: number }) => (min === max ? String(min) : min === 2 && max === 6 ? '246' : '45')

/** Distractors in order: confusable partners → same topic → any; within a tier, random. */
export function distractors(lesson: Lesson, ctx: QuestionCtx, rng: () => number): Lesson[] {
  const allowed = new Set(ctx.introduced)
  const pool = ctx.lessons.filter(l => l.id !== lesson.id && l.questionKinds.includes('identify'))
  const tiers = [
    pool.filter(l => lesson.confusableWith.includes(l.id)),
    pool.filter(l => !lesson.confusableWith.includes(l.id) && l.topicId === lesson.topicId),
    pool.filter(l => !lesson.confusableWith.includes(l.id) && l.topicId !== lesson.topicId),
  ].map(t => shuffle(t, rng))
  const ordered = tiers.flat()
  const out = ordered.filter(l => allowed.has(l.id)).slice(0, 3)
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
  const kind: QuestionKind =
    ctx.kind && kinds.includes(ctx.kind) ? ctx.kind : both ? ((item.reps ?? 0) % 2 ? 'length' : 'identify') : kinds[0]
  const exclude = ctx.excludeExampleIds ?? []

  if (kind === 'fact') {
    const fact = pick(lesson.facts, item.lastExampleId, exclude, rng)
    if (!fact) return null
    return {
      kind, lessonId: lesson.id, exampleId: fact.id, fact, prompt: fact.prompt,
      options: fact.options.map((o, i) => ({ id: String(i), labelAr: o, labelEn: o })),
      answerId: String(fact.answer), explanation: fact.explanation,
    }
  }

  const example = pick(lesson.examples, item.lastExampleId, exclude, rng)
  if (!example) return null
  const base = { lessonId: lesson.id, exampleId: example.id, example, stopping: example.stopping }

  if (kind === 'length' && lesson.counts) {
    const n = ctx.munfasilLength
    const munfasil = MUNFASIL_LIKE.includes(lesson.id)
    const options = LENGTHS.map(o => (munfasil && o.id === '45' ? { id: o.id, labelAr: n === 4 ? '٤' : '٥', labelEn: String(n) } : o))
    const answer = options.find(o => o.id === lengthId(lesson.counts!))!
    const why = example.note ?? lesson.counts.note ?? lesson.summary
    const explanation = munfasil
      ? `It's ${n} counts, the length you chose. ${n === 4 ? 5 : 4} is also correct for حفص من طريق الشاطبية; keep one length throughout. ${why}`
      : `It's ${answer.labelEn} counts: ${why}`
    return { ...base, kind, prompt: 'How many counts here?', options, answerId: answer.id, explanation }
  }

  const options = shuffle([lesson, ...distractors(lesson, ctx, rng)], rng).map(l => ({ id: l.id, labelAr: l.nameAr, labelEn: l.nameEn }))
  return {
    ...base, kind: 'identify', prompt: 'Which rule is the underlined part?', options, answerId: lesson.id,
    explanation: example.note ?? lesson.summary,
  }
}
