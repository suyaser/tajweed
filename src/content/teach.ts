// The Learn step's teaching text (docs/16-teaching-strategy.md): one file per lesson in content/teach/<id>.json,
// English and Arabic side by side, loaded with the lesson (its own chunk). The glossary (content/glossary.json) is
// built from every lesson's `terms` by src/content/teach.check.test.ts (UPDATE_GLOSSARY=1).
import glossaryJson from '../../content/glossary.json'
import { isAr } from '../i18n'

export interface Term {
  term: string // Arabic, as it appears in text (no case endings): غنة
  forms?: string[] // other written forms to match: الغنة is matched by the prefix rule; add plurals etc.
  say: string // transliteration for the English UI: ghunnah
  en: string // what it means here, one sentence
  literal?: string // the word's everyday meaning
  ar: string // المعنى بالعربية
  arLiteral?: string
}
export interface TeachText {
  plain: string // one or two sentences, no jargon
  fits: string // where it fits: what you already know, and what this adds
  how: string[] // what the mouth, tongue, lips and nose do, step by step
  why: string // why the rule exists
  spot: string | null // how to recognise it in مصحف المدينة (its marks); null when the muṣḥaf shows no sign
  mistakes: { wrong: string; right: string }[]
}
export interface Teach { lesson: string; terms: Term[]; en: TeachText; ar: TeachText }

const files = import.meta.glob<Teach>('../../content/teach/*.json', { import: 'default' })
const cache = new Map<string, Teach | undefined>()
/** The lesson's teaching text, or undefined when it has none (the Learn step then shows the rule card only). */
export async function loadTeach(lessonId: string): Promise<Teach | undefined> {
  if (cache.has(lessonId)) return cache.get(lessonId)
  const f = files[`../../content/teach/${lessonId}.json`]
  const t = f ? await f() : undefined
  cache.set(lessonId, t)
  return t
}
export const teachText = (t: Teach): TeachText => (isAr ? t.ar : t.en)

export interface GlossaryEntry extends Term { lesson: string }
export const glossary = glossaryJson as GlossaryEntry[]

/** Letters only: marks, tatweel and the shapes of alif/ya/hamza seats folded, so جوف, الجَوْف and الجوفُ compare equal. */
export const fold = (s: string) =>
  s.replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')

const PRE = '(?:^|[^\\u0621-\\u064A])(?:[وفبلك])?(?:ال)?'
const POST = '(?:ات|ان|ين|ه|ة)?(?=$|[^\\u0621-\\u064A])'
const pattern = (e: Term) => new RegExp(PRE + '(?:' + [e.term, ...(e.forms ?? [])].map(f => fold(f).replace(/^ال/, '')).join('|') + ')' + POST)
const patterns = new Map<string, RegExp>()
/** Glossary terms written in `text` (Arabic script, any vowelling). */
export function termsIn(text: string, entries: Term[] = glossary): Term[] {
  const t = fold(text)
  return entries.filter(e => {
    if (!patterns.has(e.term)) patterns.set(e.term, pattern(e))
    return patterns.get(e.term)!.test(t)
  })
}

/**
 * Jargon a beginner can't be expected to know. Each must be explained (as a `terms` entry) in some lesson, and a
 * lesson that uses one first must define it or come after the lesson that does (teach.check.test.ts).
 */
export const REQUIRED_TERMS = [
  'حركة', 'فتحة', 'ضمة', 'كسرة', 'سكون', 'شدة', 'تنوين', 'حرف مد', 'مد', 'همزة', 'همزة الوصل', 'غنة', 'الخيشوم', 'قلقلة',
  'إظهار', 'إدغام', 'إخفاء', 'إقلاب', 'تفخيم', 'ترقيق', 'استعلاء', 'وقف', 'وصل', 'ابتداء', 'اللام الشمسية', 'اللام القمرية',
  'لفظ الجلالة', 'مخرج', 'صفة', 'حروف الحلق', 'الجوف', 'لين', 'صلة', 'هاء الضمير', 'المد المتصل', 'المد المنفصل', 'مد البدل',
  'المد اللازم', 'المد العارض', 'العوض', 'روم', 'إشمام', 'سكت', 'إمالة', 'تسهيل', 'المثلين', 'المتجانسين', 'المتقاربين',
  'الميم الساكنة', 'النون الساكنة', 'التقاء الساكنين', 'لحن جلي', 'الاستعاذة', 'البسملة', 'رواية', 'حفص',
]
