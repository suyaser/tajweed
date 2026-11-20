import { surahName } from '../quran'

// Port of the artifact's bidi() walker as a pure splitter (design §2.2 B1).
// A run is Arabic letters plus spaces, ، ؛ · / ← – - . between Arabic words, so a multi-word term,
// a range (الفاتحة ١–٧) or an abbreviated title (م. علاء) is one island.
const AR = '\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF'
// A parenthesised Arabic group (a reference, a gloss) is one token, so its brackets stay balanced inside the island.
const TOK = `(?:[${AR}]+|\\([${AR}\\s·–،]+\\))`
const RUN = new RegExp(`${TOK}(?:[\\s\\u060C\\u061B←·/–\\-.]+${TOK})*`, 'g')

/** Content references `(16:125)`, `(7:111، 26:36)` become `(النحل ١٢٥)` at render time (B4: no colon refs on screen). */
export const arRefs = (s: string) =>
  s.replace(/\((\d{1,3}:\d{1,3}(?:[،,]\s*\d{1,3}:\d{1,3})*)\)/g, (_, list: string) =>
    '(' + list.split(/[،,]\s*/).map((k) => {
      const [su, a] = k.split(':').map(Number)
      return su >= 1 && su <= 114 ? `${surahName(su)} ${arDigits(a)}` : k
    }).join('، ') + ')')

/** True when a line has no Latin letters: render it as its own RTL line, not an island in an LTR sentence. */
export const isArabicLine = (s: string) => !/[A-Za-z]/.test(s) && new RegExp(`[${AR}]`).test(s)

export interface BidiPart { text: string; ar: boolean }

export function splitBidi(s: string): BidiPart[] {
  const out: BidiPart[] = []
  let last = 0
  for (const m of s.matchAll(RUN)) {
    if (m.index! > last) out.push({ text: s.slice(last, m.index), ar: false })
    out.push({ text: m[0], ar: true })
    last = m.index! + m[0].length
  }
  if (last < s.length) out.push({ text: s.slice(last), ar: false })
  return out
}

/** Arabic-Indic digits for ayah numbers, star badges, references (B4). */
export const arDigits = (n: number | string) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d])

// Arabic UI: the mirror case. A Latin run (an English word or phrase, a name, a URL, "CC BY 4.0") inside Arabic text
// is one LTR island, so its words and punctuation keep their order.
const LW = `[A-Za-z](?:[A-Za-z0-9'’.\\-@_/]*[A-Za-z0-9])?`
const LATIN = new RegExp(`${LW}(?:[\\s,:&+]+(?:${LW}|\\d+(?:\\.\\d+)?))*`, 'g')

export interface LatinPart { text: string; latin: boolean }

export function splitLatin(s: string): LatinPart[] {
  const out: LatinPart[] = []
  let last = 0
  for (const m of s.matchAll(LATIN)) {
    if (m.index! > last) out.push({ text: s.slice(last, m.index), latin: false })
    out.push({ text: m[0], latin: true })
    last = m.index! + m[0].length
  }
  if (last < s.length) out.push({ text: s.slice(last), latin: false })
  return out
}

/** A vowel mark with no letter under it (فتحة َ, a شدة (ّ)) sits on a tatweel so it shows and isolates as Arabic. */
export const carryMarks = (s: string) => s.replace(/(^|[\s(«"'])([ً-ْٰ])/g, '$1ـ$2')
