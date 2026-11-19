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

/** [letter, its marks][] of one word. */
function units(word: string): [string, string][] {
  const out: [string, string][] = []
  for (const c of word) {
    if (isLetter(c)) out.push([c, ''])
    else if (out.length) out[out.length - 1][1] += c
  }
  return out
}

/** Rules the text shows that cpfair leaves unmarked (إظهار, اللام القمرية) or that depend on stopping. Errs towards more. */
function textLessons(ex: Pick<Example, 'text' | 'stopping'>): string[] {
  const out: string[] = []
  const t = ex.text
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
export function alsoLessons(ex: Example, verse: Pick<Verse, 'text' | 'tajweed' | 'words'> | undefined, others: Example[]): string[] {
  const ids = new Set<string>(textLessons(ex))
  if (verse) {
    const [a, b] = [wordSpan(verse, ex.wordFrom)[0], wordSpan(verse, ex.wordTo)[1]]
    const cps = Array.from(verse.text)
    for (const s of verse.tajweed) {
      if (s.start >= b || s.end <= a) continue
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
  return v.words.map((_, i) => i + 1).filter(n => alsoLessons(wordEx(v, n, n), v, []).includes(lessonId))
}
