import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASMALA_PREFIX } from './data'
import { getRange, ruleColour, stripBasmala, surahName, tajweedSpans, toArabicDigits, wordSegments } from './index'
import type { Verse } from '../core/types'

const span = (rule: string, start: number, end: number) => ({ rule, start, end, src: 'cpfair' as const })

describe('tajweedSpans', () => {
  it('uses code points, not UTF-16 units, and covers the text exactly', () => {
    const text = 'a𝒳bc d' // 𝒳 is two UTF-16 units, one code point
    const segs = tajweedSpans({ text, tajweed: [span('ghunnah', 2, 3)] })
    expect(segs).toEqual([{ text: 'a𝒳' }, { text: 'b', rule: 'ghunnah', colour: 'ghunnah' }, { text: 'c d' }])
    expect(segs.map((s) => s.text).join('')).toBe(text)
  })

  it('keeps adjacent spans of different rules apart and lets the shortest overlapping span win', () => {
    const segs = tajweedSpans({ text: 'abcdef', tajweed: [span('madd_6', 0, 4), span('qalqalah', 1, 2), span('madd_2', 4, 6)] })
    expect(segs.map((s) => [s.text, s.colour])).toEqual([['a', 'madd6'], ['b', 'qalqalah'], ['cd', 'madd6'], ['ef', 'madd2']])
  })

  it('maps rules to palette keys, passes ColourKeys through, leaves unknown rules uncoloured', () => {
    expect(ruleColour('idghaam_no_ghunnah')).toBe('silent')
    expect(ruleColour('madd_munfasil')).toBe('madd45')
    expect(ruleColour('heavy')).toBe('heavy')
    expect(ruleColour('nope')).toBeUndefined()
  })

  it('wordSegments splits spans that cross a space', () => {
    const w = wordSegments({ text: 'من نور', tajweed: [span('idghaam_ghunnah', 1, 4)] })
    expect(w).toEqual([[{ text: 'م' }, { text: 'ن', rule: 'idghaam_ghunnah', colour: 'ghunnah' }], [{ text: 'ن', rule: 'idghaam_ghunnah', colour: 'ghunnah' }, { text: 'ور' }]])
  })
})

describe('stripBasmala', () => {
  const cut = Array.from(BASMALA_PREFIX).length
  it('removes the basmala and shifts offsets, dropping spans inside it', () => {
    const r = stripBasmala(112, 1, BASMALA_PREFIX + 'قُلْ', [span('hamzat_wasl', 7, 8), span('qalqalah', cut + 2, cut + 3)])
    expect(r.text).toBe('قُلْ')
    expect(r.tajweed).toEqual([span('qalqalah', 2, 3)])
  })
  it('handles the بِّسْمِ variant (95:1, 97:1)', () => {
    expect(stripBasmala(95, 1, 'بّ' + BASMALA_PREFIX.slice(1) + 'وَٱلتِّينِ', []).text).toBe('وَٱلتِّينِ')
  })
  it('leaves 1:1, 9:1 and later ayat alone', () => {
    for (const [s, a] of [[1, 1], [9, 1], [2, 2]]) expect(stripBasmala(s, a, BASMALA_PREFIX + 'x', []).text).toBe(BASMALA_PREFIX + 'x')
  })
})

describe('getRange', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('crosses a surah boundary', async () => {
    const fake = (s: number, n: number): Verse[] => Array.from({ length: n }, (_, i) => ({ verseKey: `${s}:${i + 1}`, text: '', words: [], tajweed: [] }))
    const fetchMock = vi.fn(async (url: URL) => {
      const s = Number(/(\d{3})\.json$/.exec(String(url))![1])
      return new Response(JSON.stringify(fake(s, s === 113 ? 5 : 6)))
    })
    vi.stubGlobal('fetch', fetchMock)
    const keys = (await getRange('113:4', '114:2')).map((v) => v.verseKey)
    expect(keys).toEqual(['113:4', '113:5', '114:1', '114:2'])
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/data\/surah\/113\.json$/)
    await getRange('113:1', '113:1')
    expect(fetchMock).toHaveBeenCalledTimes(2) // memoised
  })
})

it('names and digits', () => {
  expect(surahName(1)).toBe('الفاتحة')
  expect([14, 34, 76, 78, 82, 84].map(surahName)).toEqual(['إبراهيم', 'سبأ', 'الإنسان', 'النبأ', 'الانفطار', 'الانشقاق'])
  expect(toArabicDigits(2025)).toBe('٢٠٢٥')
})

it('built data: 6236 ayat, spans inside their ayah, timing word indices inside the words (spec §8.2)', () => {
  const files = import.meta.glob<Verse[]>('/public/data/surah/*.json', { eager: true, import: 'default' })
  let ayat = 0
  for (const verses of Object.values(files)) {
    for (const v of verses) {
      ayat++
      const len = Array.from(v.text).length
      expect(v.words).toEqual(v.text.split(' '))
      for (const t of v.tajweed) expect(t.start >= 0 && t.start < t.end && t.end <= len, `${v.verseKey} ${t.rule}`).toBe(true)
      for (const segs of Object.values(v.timings ?? {}))
        for (const [w0, w1] of segs) expect(w0 >= 1 && w0 <= w1 && w1 <= v.words.length, v.verseKey).toBe(true)
      for (const m of v.marks ?? []) expect(m.after >= 1 && m.after <= v.words.length && /^[\u06D6-\u06DC\u06E9]$/u.test(m.mark), v.verseKey).toBe(true)
    }
  }
  expect(ayat).toBe(6236)
  // [word after which, mark]; words compared by index (editors reorder Tanzil's shadda + fatha)
  const at = (k: string) => { const [s, a] = k.split(':'); const v = files[`/public/data/surah/${s.padStart(3, '0')}.json`][+a - 1]; return (v.marks ?? []).map((m) => [m.after, m.mark]) }
  // the four obligatory سكتات of حفص (عِوَجَا، مَّرْقَدِنَا، مَنْ، بَلْ), and the paired stop of 2:2 (رَيْبَ، فِيهِ)
  expect(at('18:1')).toEqual([[11, 'ۜ']])
  expect(at('36:52')).toEqual([[6, 'ۜ'], [6, 'ۗ']])
  expect(at('75:27')).toEqual([[2, 'ۜ']])
  expect(at('83:14')).toEqual([[1, 'ۖ'], [2, 'ۜ']])
  expect(at('2:2')).toEqual([[4, 'ۛ'], [5, 'ۛ']])
  // the basmala shown before ayah 1 is Tanzil's 1:1, verbatim
  expect(files['/public/data/surah/001.json'][0].text).toBe(BASMALA_PREFIX.trim())
})
