// Adapts the reviewed content JSON (content/*.json) to the shared types.
import type { ColourKey, ConfusablePair, ExampleRole, Lesson, MatnLine, QuestionKind, Topic } from '../core/types'
// Content: reviewed rules/pairs from content/ (see docs/04-content-review.md); verified mutun (docs/05-mutun-verification.md).
import rawRules from '../../content/rules.json'
import rawPairs from '../../content/pairs.json'
import rawMutun from '../../content/mutun.json'
import also from './also.json'
// Arabic overlay (content/ar.json), keyed by id; merged only when the UI is Arabic, English fields are the fallback.
import { arContent } from '../i18n/arData'
import { isAr, pick } from '../i18n'

const ALSO = also as Record<string, string[] | undefined>

interface RawExample { verse: string; word_from: number; word_to: number; text: string; focus: string; stop?: boolean; note?: string }
interface RawRule {
  id: string; cat: string; ar: string; en: string; color: string; definition: string
  letters?: string; counts?: { min: number; max: number; note?: string }; conditions?: string[]; tip?: string
  list?: string[][]
  examples?: (RawExample & { role?: ExampleRole; contrast?: RawExample & { lesson: string } })[]
  facts?: { q: string; options: string[]; answer: number | string; why: string }[]
  sources?: (string | { title: string; locator?: string })[]
  review?: { status: string; notes?: string }
}

export interface ArContent {
  topics: Record<string, { name?: string; intro?: string } | undefined>
  lessons: Record<string, {
    nameEn?: string; definition?: string; conditions?: string[]; tip?: string; countsNote?: string; list?: string[][]
    exampleNotes?: Record<string, string>; reviewNotes?: string; facts?: { q: string; options: string[]; why: string }[]
  } | undefined>
  units: Record<string, { name?: string; intro?: string; mutun?: string[] } | undefined>
  course: Record<string, { notice?: string } | undefined>
  pairs: Record<string, string | undefined>
  mutun: Record<string, string | undefined>
}
export const AR_CONTENT = (arContent.data ?? { topics: {}, lessons: {}, units: {}, course: {}, pairs: {}, mutun: {} }) as ArContent

const CATS: [id: string, nameAr: string, nameEn: string, intro: string][] = [
  ['found', 'المخارج والصفات', 'Foundations', 'Before any rule: each letter from its place (المخرج) with its qualities (الصفات).'],
  ['nun', 'النون الساكنة والتنوين', 'Noon with sukoon & tanween', 'Look at the letter after the نْ or the تنوين. That letter decides which of the four rules applies.'],
  ['meem', 'الميم الساكنة', 'Meem with sukoon', 'Look at the letter after the مْ. There are three outcomes.'],
  ['ghunnah', 'الغنة', 'The nasal sound', 'A sound from the nose (الخيشوم), held for two counts on every نّ and مّ.'],
  ['lam', 'أحكام اللام', 'Laam rules', 'Two questions: is it the ل of ال, or the ل in the name اللَّه?'],
  ['ra', 'أحكام الراء', 'Heavy or light ر', "Look at the ر's own vowel first. If it has سكون, look at the letter before it."],
  ['qal', 'القلقلة', 'The echo', 'Five letters bounce when they carry سكون: قطب جد.'],
  ['madd', 'المدود', 'Lengthening', 'Every مد starts at 2 counts. A همزة or a سكون after it makes it longer.'],
  ['merge', 'المثلان والمتجانسان والمتقاربان', 'When two letters meet', 'When two letters meet and the first has سكون, they may merge into one.'],
  ['waqf', 'الوقف والابتداء', 'Stopping & starting', 'Where to stop, how to stop, and how to start again.'],
  ['hafs', 'كلمات خاصة برواية حفص', 'Special words in Hafs', 'A few words in رواية حفص have their own way of reading.'],
]
// Topics that are not a muṣḥaf colour rule: their lessons get no colour (UX review M4).
const NO_COLOUR = new Set(['found', 'waqf', 'hafs'])
export const topics: Topic[] = CATS.map(([id, nameAr, nameEn, intro], order) => ({
  id, nameAr, nameEn: pick(nameEn, AR_CONTENT.topics[id]?.name), intro: pick(intro, AR_CONTENT.topics[id]?.intro), order,
}))

export const pairs: ConfusablePair[] = (rawPairs as { id?: string; a: string; b: string; hint?: string; difference?: string }[]).map(p => ({
  id: p.id ?? `${p.a}~${p.b}`, a: p.a, b: p.b, hint: pick(p.hint ?? p.difference ?? '', AR_CONTENT.pairs[p.id ?? `${p.a}~${p.b}`]),
}))

export const mutun: MatnLine[] = rawMutun.lines.map(l => ({
  id: `${l.text}-${l.n}`, matn: l.text as MatnLine['matn'], n: l.n, sadr: l.sadr, ajz: l.ajuz,
  page: l.page == null ? undefined : String(l.page), url: l.url, lessonIds: l.rules, gloss: pick(l.gloss, AR_CONTENT.mutun[`${l.text}-${l.n}`]),
  verified: l.verified as MatnLine['verified'],
}))

/** The one English phrase in source locators (rules.json), in Arabic for the Arabic UI. */
const arLocator = (l: string) => (isAr ? l.replace(/paging per the OpenITI copy of/g, 'بترقيم نسخة OpenITI من') : l)

const NO_IDENTIFY = /^(makharij-|sifat-|maratib$|ibtida$|waqf-signs$|waqf-how$)/

export const lessons: Lesson[] = (rawRules as RawRule[]).map((r, order) => {
  const a = isAr ? AR_CONTENT.lessons[r.id] : undefined
  const examples = (r.examples ?? []).map((e, i) => ({
    id: `${r.id}#${i + 1}`, lessonId: r.id, verseKey: e.verse, wordFrom: e.word_from, wordTo: e.word_to,
    text: e.text, focus: e.focus, stopping: !!e.stop, ...(e.note ? { note: pick(e.note, a?.exampleNotes?.[i + 1]) } : {}),
    also: ALSO[`${r.id}#${i + 1}`], ...(e.role ? { role: e.role } : {}),
    ...(e.contrast ? { contrast: {
      id: `${r.id}#${i + 1}c`, lessonId: e.contrast.lesson, verseKey: e.contrast.verse, wordFrom: e.contrast.word_from, wordTo: e.contrast.word_to,
      text: e.contrast.text, focus: e.contrast.focus, stopping: !!e.contrast.stop,
      ...(e.contrast.note ? { note: pick(e.contrast.note, a?.exampleNotes?.[`${i + 1}c`]) } : {}),
    } } : {}),
  }))
  const facts = (r.facts ?? []).map((f, i) => ({
    id: `${r.id}?${i + 1}`, lessonId: r.id, prompt: pick(f.q, a?.facts?.[i]?.q),
    options: a?.facts?.[i]?.options.length === f.options.length ? a.facts[i].options : f.options,
    answer: typeof f.answer === 'number' ? f.answer : f.options.indexOf(f.answer), explanation: pick(f.why, a?.facts?.[i]?.why),
  }))
  const questionKinds: QuestionKind[] = []
  // "Which rule is highlighted?" only where one answer is right: a letter has a مخرج and several صفات at once (ق is
  // مستعلٍ, مقلقل and شديد), and a ابتداء/وقف example names a way of reading, not a rule in the letters (unit 9 review X1)
  if (examples.length && !NO_IDENTIFY.test(r.id)) questionKinds.push('identify')
  if (r.counts && r.cat === 'madd') questionKinds.push('length')
  if (facts.length) questionKinds.push('fact')
  return {
    id: r.id, topicId: r.cat, order, nameAr: r.ar, nameEn: pick(r.en, a?.nameEn), colour: NO_COLOUR.has(r.cat) ? undefined : (r.color as ColourKey),
    summary: pick(r.definition, a?.definition), letters: r.letters,
    counts: r.counts?.note && a?.countsNote ? { ...r.counts, note: a.countsNote } : r.counts,
    conditions: pick(r.conditions, a?.conditions), tip: pick(r.tip, a?.tip),
    list: pick(r.list, a?.list) as [string, string][] | undefined, examples, facts, questionKinds,
    confusableWith: pairs.flatMap(p => (p.a === r.id ? [p.b] : p.b === r.id ? [p.a] : [])),
    sources: (r.sources ?? []).map(s => (typeof s === 'string' ? { title: s, locator: '' } : { title: s.title, locator: arLocator(s.locator ?? '') })),
    review: { status: r.review?.status === 'verified' ? 'verified' : 'needs-teacher', notes: pick(r.review?.notes, a?.reviewNotes) },
  }
})

/**
 * The say-aloud drill for a مخارج / صفات lesson (learning review M3): each of its letters with سكون after a همزة,
 * أَبْ، أَتْ، …; the حروف المد after a ب. Empty for other lessons.
 */
export function drillFor(lesson: Lesson): string[] {
  if (lesson.topicId !== 'found' || !lesson.letters) return []
  if (lesson.id === 'makharij-jawf') return ['بَا', 'بُو', 'بِي']
  const letters = lesson.letters.split(/[\s·:،()]+/).map(t => t.replace(/[\u0640\u064B-\u0652]/g, '')).filter(t => /^[\u0621-\u064A]$/.test(t))
  return [...new Set(letters)].map(l => `أَ${l === 'ء' ? 'أ' : l}ْ`)
}

const byId = new Map(lessons.map(l => [l.id, l]))
export const getLesson = (id: string): Lesson | undefined => byId.get(id)
