import type { VerseKey } from '../../core/types'
import { ayahCount, surahName, toArabicDigits } from '../../quran'

export interface Range { from: VerseKey; to: VerseKey }

/** The default passage when #/listen has no (valid) range: الفاتحة. */
export const DEFAULT_RANGE: Range = { from: '1:1', to: '1:7' }

const key = (s: string, a: string | undefined, fallbackAyah: number): [number, number] | null => {
  const n = +s
  const k = a == null ? fallbackAyah : +a
  if (!Number.isInteger(n) || n < 1 || n > 114) return null
  if (!Number.isInteger(k) || k < 1 || k > ayahCount(n)) return null
  return [n, k]
}

/**
 * Route param → range. Accepts `1:1-1:7`, `112:1-114:6`, `93:5` (one ayah), `93:1-5` (same surah) and `93`
 * (whole surah). Returns null when malformed, out of bounds, or backwards.
 */
export function parseRange(raw: string | undefined): Range | null {
  const m = /^\s*(\d+)(?::(\d+))?(?:\s*[-–]\s*(?:(\d+):)?(\d+))?\s*$/.exec(raw ?? '')
  if (!m) return null
  const [, s1, a1, s2, a2] = m
  if (a1 == null && a2 != null) return null // '93-5' is ambiguous
  const from = key(s1, a1, 1)
  if (!from) return null
  const to = a2 == null ? (a1 == null ? key(s1, undefined, ayahCount(+s1)) : from) : key(s2 ?? s1, a2, 0)
  if (!to) return null
  if (to[0] < from[0] || (to[0] === from[0] && to[1] < from[1])) return null
  return { from: from.join(':'), to: to.join(':') }
}

/** Longest passage #/listen loads: the whole Quran would be ~11 MB of text and thousands of words on screen (M7). */
export const MAX_AYAT = 300

/** The first `max` ayat of a range (the range itself when it is shorter). */
export function capRange({ from, to }: Range, max = MAX_AYAT): Range {
  let [s, a] = from.split(':').map(Number)
  const [s2, a2] = to.split(':').map(Number)
  for (let n = 1; n < max && !(s === s2 && a === a2); n++) {
    if (a < ayahCount(s)) a++
    else { s++; a = 1 }
  }
  return { from, to: `${s}:${a}` }
}

/** URL form: `93:1-93:11`, or `93:5` for one ayah. */
export const rangeParam = ({ from, to }: Range) => (from === to ? from : `${from}-${to}`)

/** On-screen form (design B4): `الضحى · ١–١١`, `الضحى · ٥`, `الإخلاص ١ – الناس ٦`. */
export function rangeLabel({ from, to }: Range): string {
  const [s1, a1] = from.split(':').map(Number)
  const [s2, a2] = to.split(':').map(Number)
  if (s1 !== s2) return `${surahName(s1)} ${toArabicDigits(a1)} – ${surahName(s2)} ${toArabicDigits(a2)}`
  return `${surahName(s1)} · ${toArabicDigits(a1)}${a1 === a2 ? '' : '–' + toArabicDigits(a2)}`
}

export const refLabel = (k: VerseKey) => rangeLabel({ from: k, to: k })

/** Search normaliser: strips Arabic diacritics and tatweel, unifies alef forms and ى/ي, lowercases Latin. */
export const normalize = (s: string) =>
  s.normalize('NFC').replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase().trim()
