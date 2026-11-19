// Adapts the reviewed content JSON (content/*.json) to the shared types.
import type { ColourKey, ConfusablePair, Lesson, MatnLine, Phase, QuestionKind, Topic } from '../core/types'
// Content: reviewed rules/pairs from content/ (see docs/04-content-review.md); verified mutun (docs/05-mutun-verification.md).
import rawRules from '../../content/rules.json'
import rawPairs from '../../content/pairs.json'
import rawMutun from '../../content/mutun.json'
import also from './also.json'

const ALSO = also as Record<string, string[] | undefined>

interface RawRule {
  id: string; cat: string; phase: number; ar: string; en: string; color: string; definition: string
  letters?: string; counts?: { min: number; max: number; note?: string }; conditions?: string[]; tip?: string
  list?: string[][]
  examples?: { verse: string; word_from: number; word_to: number; text: string; focus: string; stop?: boolean; note?: string }[]
  facts?: { q: string; options: string[]; answer: number | string; why: string }[]
  sources?: (string | { title: string; locator?: string })[]
  review?: { status: string; notes?: string }
}

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
export const topics: Topic[] = CATS.map(([id, nameAr, nameEn, intro], order) => ({ id, nameAr, nameEn, intro, order }))

export const pairs: ConfusablePair[] = (rawPairs as { id?: string; a: string; b: string; hint?: string; difference?: string }[]).map(p => ({
  id: p.id ?? `${p.a}~${p.b}`, a: p.a, b: p.b, hint: p.hint ?? p.difference ?? '',
}))

export const mutun: MatnLine[] = rawMutun.lines.map(l => ({
  id: `${l.text}-${l.n}`, matn: l.text as MatnLine['matn'], n: l.n, sadr: l.sadr, ajz: l.ajuz,
  page: l.page == null ? undefined : String(l.page), url: l.url, lessonIds: l.rules, gloss: l.gloss,
  verified: l.verified as MatnLine['verified'],
}))

export const lessons: Lesson[] = (rawRules as RawRule[]).map((r, order) => {
  const examples = (r.examples ?? []).map((e, i) => ({
    id: `${r.id}#${i + 1}`, lessonId: r.id, verseKey: e.verse, wordFrom: e.word_from, wordTo: e.word_to,
    text: e.text, focus: e.focus, stopping: !!e.stop, ...(e.note ? { note: e.note } : {}),
    also: ALSO[`${r.id}#${i + 1}`],
  }))
  const facts = (r.facts ?? []).map((f, i) => ({
    id: `${r.id}?${i + 1}`, lessonId: r.id, prompt: f.q, options: f.options,
    answer: typeof f.answer === 'number' ? f.answer : f.options.indexOf(f.answer), explanation: f.why,
  }))
  const questionKinds: QuestionKind[] = []
  if (examples.length) questionKinds.push('identify')
  if (r.counts && r.cat === 'madd') questionKinds.push('length')
  if (facts.length) questionKinds.push('fact')
  return {
    id: r.id, topicId: r.cat, phaseId: r.phase, order, nameAr: r.ar, nameEn: r.en, colour: NO_COLOUR.has(r.cat) ? undefined : (r.color as ColourKey),
    summary: r.definition, letters: r.letters, counts: r.counts, conditions: r.conditions, tip: r.tip,
    list: r.list as [string, string][] | undefined, examples, facts, questionKinds,
    confusableWith: pairs.flatMap(p => (p.a === r.id ? [p.b] : p.b === r.id ? [p.a] : [])),
    sources: (r.sources ?? []).map(s => (typeof s === 'string' ? { title: s, locator: '' } : { title: s.title, locator: s.locator ?? '' })),
    review: { status: r.review?.status === 'verified' ? 'verified' : 'needs-teacher', notes: r.review?.notes },
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

const ofPhase = (n: number) => lessons.filter(l => l.phaseId === n).map(l => l.id)
const range = (id: string, label: string, from: string, to: string) => ({ id, label, from, to })

export const phases: Phase[] = [
  {
    id: 1, weeks: 'Weeks 1–2', nameAr: 'التأسيس', nameEn: 'Foundations', goal: 'Read fluently and fix الفاتحة.',
    doneWhen: 'الفاتحة has no clear errors.',
    tasks: [
      'Watch the six episodes of the course by المهندس علاء حامد, one a day, for the big picture',
      'After each episode, open the mind map and read the cards it mentions',
      'Know the letters, الحركات، السكون، الشدة and التنوين by sight and sound (القاعدة النورانية if still slow)',
      'Learn the difference between اللحن الجلي and اللحن الخفي',
      'Recite الفاتحة to a teacher and fix every clear error',
      'Start the daily 40-minute routine with الحصري',
    ],
    milestone: [range('p1-fatiha', 'الفاتحة', '1:1', '1:7')],
  },
  {
    id: 2, weeks: 'Weeks 3–6', nameAr: 'المخارج والصفات', nameEn: 'Where and how letters are made', goal: 'Every letter from its right place.',
    doneWhen: 'Each letter sounds right on its own and inside words.',
    tasks: [
      'Learn the 5 areas and 17 points',
      'Drill each letter as أَبْ، أَتْ، أَثْ… and record it (each lesson’s “say it aloud” step); recite the drill to your teacher',
      'Drill the confusing pairs: ح ه · ع ء · ص س · ط ت · ق ك · ذ ز ظ · ث س · ض د',
      'Learn الصفات with opposites, then the single qualities',
      'Ask your teacher to check every letter once',
    ],
    milestone: [range('p2-fatiha', 'الفاتحة', '1:1', '1:7'), range('p2-ikhlas-nas', 'الإخلاص – الناس', '112:1', '114:6')],
  },
  {
    id: 3, weeks: 'Weeks 7–9', nameAr: 'النون والميم والغنة', nameEn: 'Nasal rules', goal: 'The most frequent rules in the Quran.',
    doneWhen: 'سورة الضحى to سورة الناس recited with correct غنة and نون rules.',
    tasks: [
      'أحكام النون الساكنة والتنوين: the 4 rules', 'أحكام الميم الساكنة: the 3 rules', 'الغنة المشددة: hold 2 counts',
      'أحكام اللام: ال and the لام of اللَّه', 'Find 10 examples of each rule in جزء عمّ', 'Memorise the matching lines of تحفة الأطفال',
    ],
    milestone: [range('p3-duha-adiyat', 'الضحى – العاديات', '93:1', '100:11'), range('p3-qariah-nas', 'القارعة – الناس', '101:1', '114:6')],
  },
  {
    id: 4, weeks: 'Weeks 10–13', nameAr: 'المد والقلقلة والتفخيم', nameEn: 'Lengths, echo, heavy and light',
    goal: 'Correct lengths and the right weight for each letter.', doneWhen: 'جزء عمّ with even, consistent مد lengths.',
    tasks: [
      'المد الطبيعي and what follows it: العوض، الصلة، البدل',
      'المد بسبب الهمز: choose your المنفصل length (4 or 5) and keep it',
      'المد بسبب السكون: العارض، اللين، اللازم', 'القلقلة الصغرى والكبرى',
      'الراء heavy and light; the heavy letters خص ضغط قظ', 'Count on your fingers while reciting until counts feel natural',
    ],
    milestone: [
      range('p4-naba-abasa', 'النبأ – عبس', '78:1', '80:42'),
      range('p4-takwir-tariq', 'التكوير – الطارق', '81:1', '86:17'),
      range('p4-ala-layl', 'الأعلى – الليل', '87:1', '92:21'),
      range('p4-duha-adiyat', 'الضحى – العاديات', '93:1', '100:11'),
      range('p4-qariah-kawthar', 'القارعة – الكوثر', '101:1', '108:3'),
      range('p4-kafirun-nas', 'الكافرون – الناس', '109:1', '114:6'),
    ],
  },
  {
    id: 5, weeks: 'Weeks 14–16', nameAr: 'الوصل والوقف', nameEn: 'Joining and stopping', goal: 'Read long passages with meaning and flow.',
    doneWhen: 'A full page read with correct stops and starts.',
    tasks: [
      'المثلان والمتجانسان والمتقاربان', 'علامات الوقف and how to stop on each word ending', 'الابتداء and همزة الوصل',
      'The special words of حفص: السكت، الإمالة، الإشمام، التسهيل', 'Recite سورة الملك to your teacher',
    ],
    milestone: [range('p5-mulk', 'الملك', '67:1', '67:30')],
  },
  {
    id: 6, weeks: 'Month 5 on', nameAr: 'الإتقان', nameEn: 'Mastery', goal: 'From knowing the rules to reciting without thinking about them.',
    doneWhen: 'A teacher confirms your recitation is free of clear errors and consistent in the rules.',
    tasks: [
      'Memorise المقدمة الجزرية', 'Recite the whole Quran to a teacher, page by page (ختمة)',
      'Practise the three speeds: التحقيق (slow), التدوير (medium), الحدر (fast)',
      'Keep a mistakes log and review it every week', 'Ask your teacher about the path to الإجازة',
    ],
    milestone: [],
  },
].map(p => ({ ...p, lessonIds: ofPhase(p.id) }))
