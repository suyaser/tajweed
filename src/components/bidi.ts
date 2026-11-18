// Port of the artifact's bidi() walker as a pure splitter (design §2.2 B1).
// A run is Arabic letters plus spaces, ، ؛ · / ← between Arabic words, so a multi-word term is one island.
const AR = '\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF'
const RUN = new RegExp(`[${AR}]+(?:[\\s\\u060C\\u061B←·/]+[${AR}]+)*`, 'g')

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
