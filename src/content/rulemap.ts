// cpfair rule names → lesson ids, and the "which other lessons also show in these words" check (tajweed review B1).
import type { Example, Verse } from '../core/types'

/** cpfair / our rule names → lesson ids (content/rules.json). First id is the usual one (correction suggestions). */
export const RULE_LESSONS: Record<string, string[]> = {
  ghunnah: ['ghunnah'], ikhfa: ['ikhfa'], ikhfa_shafawi: ['m-ikhfa'], iqlab: ['iqlab'], idghaam_ghunnah: ['idgh-g'],
  idghaam_shafawi: ['m-idgham'], idghaam_no_ghunnah: ['idgh-n'], idghaam_mutajanisayn: ['mutajanisayn'],
  idghaam_mutaqaribayn: ['mutaqaribayn'], lam_shamsiyyah: ['lam-s'], hamzat_wasl: ['ibtida'], madd_2: ['tabii'],
  madd_muttasil: ['muttasil'], madd_munfasil: ['munfasil', 'silah-k'], madd_246: ['arid', 'lin'], madd_6: ['lazim-k', 'lazim-h'],
  qalqalah: ['qal-s', 'qal-k'],
}

/** Code-point [start, end) of 1-based word `n` in verse.text. */
export function wordSpan(v: Pick<Verse, 'words'>, n: number): [number, number] {
  let start = 0
  for (let i = 0; i < n - 1; i++) start += Array.from(v.words[i] ?? '').length + 1
  return [start, start + Array.from(v.words[n - 1] ?? '').length]
}

const HARAKA = /[َ-ِ]/ // فتحة ضمة كسرة
const SHADDA = 'ّ'
const SUKUN = 'ْ'
const DAGGER = 'ٰ'
const isLetter = (c: string) => /[ء-غف-يٱ]/.test(c)
const HAMZA = '(?:[ءأإؤئ]|ـ\u0654)'

/** [letter, its marks][] of one word. */
function units(word: string): [string, string][] {
  const out: [string, string][] = []
  for (const c of word) {
    if (isLetter(c)) out.push([c, ''])
    else if (out.length) out[out.length - 1][1] += c
  }
  return out
}

const ALLAH = /ل([\u0650\u0651]*)ل\u0651\u064Eه[\u064E-\u0650](?:م\u0651\u064E)?$/ // ٱللَّه، لِلَّه، ٱللَّهُمَّ; not ٱللَّهْو، ٱللَّهَب
const lastVowel = (s: string) => s.match(/[\u064B-\u0650](?=[^\u064B-\u0650]*$)/)?.[0]
// A word that ends in سكون and takes a vowel before همزة الوصل (قُلِ ٱللَّهُ، مِنَ ٱلنَّاسِ، لَمْ يَكُنِ ٱلَّذِينَ).
const MOVED = /^(?:[وف]َ)?(قُلِ|قُمِ|أَنِ|إِنِ|مَنِ|عَنِ|مِنَ|قَدِ|لَقَدِ|أَوِ|لَوِ|يَكُنِ|تَكُنِ|إِذِ|بَلِ|ل\u0651?َٰكِنِ)$|[^ا\u0670]َتِ$/ // + تاء التأنيث: زُلْزِلَتِ ٱلْأَرْضُ

/** The ل of the name اللَّه in `word`: light after a كسرة (in the word or the word before, `prev`), else heavy. */
function allahLam(word: string, prev: string | undefined): string | undefined {
  const m = word.match(ALLAH)
  if (!m) return undefined
  if (m[1].includes('\u0650')) return 'lam-jl' // لِلَّهِ
  const before = word.slice(0, m.index).replace(/ٱ$/, '')
  const v = before ? lastVowel(before) ?? '\u064E' /* ءَآللَّهُ */ : prev ? lastVowel(prev) : undefined
  return v && /[\u064C\u064D\u0650\u064B]/.test(v) ? 'lam-jl' : 'lam-jh' // تنوين takes a كسرة before همزة الوصل
}

/**
 * Rules the text shows that cpfair leaves unmarked (إظهار, اللام القمرية, the ل of اللَّه, heavy letters, ...) or that
 * depend on stopping. `prev` / `next` are the words around the text, if any (`next` only counts when joined). A rule
 * across two words (التقاء الساكنين، الصلة، المثلين) shows on the first word, the one whose ending changes. Errs towards more.
 */
const NATURAL = /\u064E\u0627(?!\u0653)|\u0670(?!\u0653)|\u064F\u0648(?![\u064B-\u0653\u06E1])|\u0650\u064A(?![\u064B-\u0653\u06E1])/

function textLessons(ex: Pick<Example, 'text' | 'stopping'>, prev?: string, next?: string): string[] {
  const out: string[] = []
  const t = ex.text
  const words = t.split(' ')
  for (const [i, w] of words.entries()) {
    const p = i ? words[i - 1] : prev
    const nx = i < words.length - 1 ? words[i + 1] : ex.stopping ? undefined : next
    const lam = allahLam(w, p)
    if (lam) out.push(lam)
    // المد الطبيعي from the text (the markup mostly marks only the small alif). At a stop the مد before the last
    // letter is عارض, so the last two letters of a stopped-on word are left out. ٓ marks a longer مد (its own lessons).
    const body = !nx && ex.stopping ? units(w).slice(0, -2).map(([l, m]) => l + m).join('') : w
    if (NATURAL.test(body)) out.push('tabii')
    if (!nx) continue
    if (nx.startsWith('ٱ') && (/([اىو][\u06DF\u0670]?|[\u064B-\u064D][اى]?|[هكت][\u064F\u0650]مُ)$/.test(w) || MOVED.test(w)))
      out.push('sakinayn')
    if (/ه[\u064F\u0650][\u06E5\u06E6]$/.test(w) && !/^[ءأإؤئٱ]/.test(nx)) out.push('silah-s') // هُۥ هِۦ before a word with no همزة
    // هَل لَّكُم; مْ مّ and نْ نّ have their own lessons
    const last = w.slice(-1)
    if (/[\u0628-\u0644\u0647-\u064A]/.test(last) && nx.startsWith(last + '\u0651')) out.push('mithlayn')
  }
  if (new RegExp(`${HAMZA}(?:\u064E[\u0627\u0670]|\u064F\u0648|\u0650[\u064A\u0649])(?![\u064B-\u0653\u06DF])`).test(t)) out.push('badal')
  if (new RegExp(`${HAMZA}(?:\u064Eآ|[\u064E-\u0650][\u0627\u0648\u064A\u0670]\u0653)`).test(t)) out.push('aqwa-maddayn') // بدل meets لازم or منفصل
  if (/[خصضغطقظ]/.test(t)) out.push('tafkhim')
  if (/[ضظ]/.test(t)) out.push('dad-zha')
  if (/[\u06DF\u06E0]/.test(t)) out.push('silent-letters') // ۟ never read, ۠ read only at a stop
  if (t.includes('\u06EA')) out.push('imalah')
  if (t.includes('\u06EB')) out.push('ishmam')
  if (t.includes('\u06EC')) out.push('tashil')
  if (/(نْ|[ً-ٍ]\S*)\s*[ءأإؤئهعحغخ]/.test(t)) out.push('izhar')
  if (/مْ\s*[\u0621-\u0627\u0629-\u063A\u0641-\u0644\u0646-\u064A]/.test(t)) out.push('m-izhar')
  if (/ٱلْ/.test(t)) out.push('lam-q') // اللام الشمسية comes from the spans (lam_shamsiyyah)
  if (ex.stopping) {
    const u = units(t.split(' ').pop() ?? '')
    const [prev, last] = [u[u.length - 2], u[u.length - 1]]
    if (prev && last && last[0] !== 'ا' && last[0] !== 'ى') {
      const [l, m] = prev
      if (m.includes(DAGGER) || l === 'ا' || ((l === 'و' || l === 'ي' || l === 'ى') && !HARAKA.test(m) && !m.includes(SHADDA)))
        out.push(m.includes(SUKUN) && (l === 'و' || l === 'ي') ? 'lin' : 'arid')
      if ('قطبجد'.includes(last[0])) out.push('qal-k')
      const h = u[u.length - 3]
      if ('اوي'.includes(l) && h && (/[ءأإؤئ]/.test(h[0]) || h[1].includes('\u0654'))) out.push('aqwa-maddayn') // بدل meets العارض: يَسْتَهْزِءُونَ
    }
    if (/[ً]ا?$/.test(t)) out.push('iwad')
  }
  return out
}

/** One span → the lesson it shows, where cpfair's rule name covers several lessons. */
function spanLesson(rule: string, span: string, stoppedOn: boolean): string | undefined {
  if (rule === 'madd_246') return span.includes(SUKUN) ? 'lin' : 'arid' // اللين: وْ يْ
  if (rule === 'madd_6') return /[\u0628-\u064A]\u0653/.test(span) ? 'lazim-h' : 'lazim-k' // لٓ مٓ: a letter name
  if (rule === 'madd_munfasil') return /[\u06E5\u06E6]/.test(span) ? 'silah-k' : 'munfasil' // ۥ ۦ of the pronoun
  if (rule === 'qalqalah') return stoppedOn ? 'qal-k' : 'qal-s'
  return RULE_LESSONS[rule]?.[0]
}

/**
 * Lesson ids, other than the example's own, whose rule also shows in the example's words: from the verse's tajweed
 * spans on those words, from the text itself, and any lesson that lists the same words (`others`).
 */
export function alsoLessons(ex: Example, verse: Pick<Verse, 'text' | 'tajweed' | 'words'> | undefined, others: Example[], startOnly = false): string[] {
  const ids = new Set<string>(textLessons(ex, verse?.words[ex.wordFrom - 2], verse?.words[ex.wordTo]))
  if (verse) {
    const [a, b] = [wordSpan(verse, ex.wordFrom)[0], wordSpan(verse, ex.wordTo)[1]]
    const cps = Array.from(verse.text)
    for (const s of verse.tajweed) {
      if (s.start >= b || s.end <= a || (startOnly && s.start < a)) continue // startOnly: a span that crosses into the next word belongs to its first word
      const span = cps.slice(s.start, s.end + 1).join('') // + the mark after: a span can stop before its سكون
      const atEnd = !cps.slice(s.end, b).some(isLetter)
      ids.add(spanLesson(s.rule, span, ex.stopping && atEnd) ?? '')
    }
    ids.delete('')
  }
  for (const o of others)
    if (o.verseKey === ex.verseKey && o.wordFrom <= ex.wordTo && o.wordTo >= ex.wordFrom) ids.add(o.lessonId)
  ids.delete(ex.lessonId)
  return [...ids].sort()
}

const wordEx = (v: Pick<Verse, 'verseKey' | 'words'>, from: number, to: number): Example => ({
  id: '', lessonId: '', verseKey: v.verseKey, wordFrom: from, wordTo: to,
  text: v.words.slice(from - 1, to).join(' '), focus: '', stopping: to === v.words.length,
})

/** Lesson ids whose rule shows anywhere in the ayah, read with a stop at its end (v2 closing passages). */
export const lessonsInAyah = (v: Pick<Verse, 'verseKey' | 'text' | 'tajweed' | 'words'>): string[] =>
  alsoLessons(wordEx(v, 1, v.words.length), v, [])

/** 1-based word numbers in the ayah that show `lessonId` (v2 Find step). Empty when the data can't detect it. */
export function findTargets(v: Pick<Verse, 'verseKey' | 'text' | 'tajweed' | 'words'>, lessonId: string): number[] {
  return v.words.map((_, i) => i + 1).filter(n => alsoLessons(wordEx(v, n, n), v, [], true).includes(lessonId))
}
