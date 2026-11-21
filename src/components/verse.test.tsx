import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { Passage, VerseBlock } from './Verse'

const html = (el: JSX.Element) => renderToStaticMarkup(el)

it('focusText highlights only that part of the focused words; falls back to whole words', () => {
  const t = 'وَقِيلَ مَنْ رَاقٍ'
  const out = html(<VerseBlock text={t} focus={[2, 3]} focusText="نْ رَ" />)
  expect(out.match(/<mark class="focus">([^<]*)<\/mark>/g)).toEqual(['<mark class="focus">نْ</mark>', '<mark class="focus">رَ</mark>'])
  expect(html(<VerseBlock text={t} focus={[2, 2]} focusText="xyz" />)).toMatch(/<mark class="focus"><span class="w">مَنْ<\/span>/)
})

it('pause marks follow their word; ayah 1 gets the surah title and basmala (not for 1 or 9)', () => {
  const out = html(<VerseBlock text="وَقِيلَ مَنْ رَاقٍ" pauses={[{ after: 2, mark: 'ۜ' }]} verseKey="75:27" />)
  expect(out).toContain('مَنْ</span><span class="pause" role="img" aria-label="pause mark: sakt"> ۜ</span> ')
  const p = html(<Passage ayahs={[{ key: '8:75', n: 75, text: 'a' }, { key: '9:1', n: 1, text: 'b' }, { key: '10:1', n: 1, text: 'c' }]} />)
  expect(p.match(/surah-name[^>]*>[^<]*/g)).toEqual(['surah-name" role="heading" aria-level="3">سورة التوبة', 'surah-name" role="heading" aria-level="3">سورة يونس'])
  expect(p.match(/class="basmala"/g)).toHaveLength(1)
  expect(p.indexOf('basmala')).toBeGreaterThan(p.indexOf('يونس'))
})

it('a word split into tajweed segments gets one highlight, so no vowel mark is cut off from its letter', () => {
  // بَرَآءَةٌ as the data splits it (the madd in its own segment); colours off, as in lessons
  const segments = [{ text: 'بَ' }, { text: 'رَآ', colour: 'madd2' as const }, { text: 'ءَةٌ' }, { text: ' مِّنَ' }]
  const out = html(<VerseBlock segments={segments} tajweed={false} focus={[1, 1]} focusText="بَرَآءَةٌ" />)
  expect(out.match(/<mark class="focus">([^<]*)<\/mark>/g)).toEqual(['<mark class="focus">بَرَآءَةٌ</mark>'])
})
