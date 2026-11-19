import { splitBidi, arDigits, arRefs, carryMarks, isArabicLine } from './bidi'

test('wraps multi-word Arabic runs as one island, keeps Latin punctuation outside', () => {
  expect(splitBidi('This is النون الساكنة والتنوين, then إدغام.')).toEqual([
    { text: 'This is ', ar: false },
    { text: 'النون الساكنة والتنوين', ar: true },
    { text: ', then ', ar: false },
    { text: 'إدغام', ar: true },
    { text: '.', ar: false },
  ])
})

test('joins a reference across the middle dot, plain Latin passes through', () => {
  expect(splitBidi('الضحى ٥')).toEqual([{ text: 'الضحى ٥', ar: true }])
  expect(splitBidi('12 reviews')).toEqual([{ text: '12 reviews', ar: false }])
  expect(arDigits(114)).toBe('١١٤')
})

test('ranges, slashes and abbreviated titles stay inside one island (M1, M2)', () => {
  expect(splitBidi('Recite الفاتحة ١–٧ ›')).toEqual([
    { text: 'Recite ', ar: false },
    { text: 'الفاتحة ١–٧', ar: true },
    { text: ' ›', ar: false },
  ])
  expect(splitBidi('episodes of م. علاء حامد.')).toEqual([
    { text: 'episodes of ', ar: false },
    { text: 'م. علاء حامد', ar: true },
    { text: '.', ar: false },
  ])
  expect(splitBidi('النبأ ٣ – عبس ٤٢ / الضحى')[0]).toEqual({ text: 'النبأ ٣ – عبس ٤٢ / الضحى', ar: true })
})

test('colon references render as Arabic surah + Arabic-Indic digits inside the island (M3)', () => {
  const s = arRefs('ٱدْعُ (16:125) ← اُدْعُ')
  expect(s).toBe('ٱدْعُ (النحل ١٢٥) ← اُدْعُ')
  expect(isArabicLine(s)).toBe(true)
  expect(splitBidi(arRefs('Exception: مَنْ ۜ رَاقٍ (75:27) has a سكت')).map((p) => p.text)).toEqual(['Exception: ', 'مَنْ ۜ رَاقٍ (القيامة ٢٧)', ' has a ', 'سكت'])
  expect(arRefs('أَرْجِهْ (7:111، 26:36)')).toBe('أَرْجِهْ (الأعراف ١١١، الشعراء ٣٦)')
})

test('a vowel mark with no letter rides a tatweel; marks on letters are untouched', () => {
  expect(carryMarks('فتحة َ and a شدة (ّ)')).toBe('فتحة ـَ and a شدة (ـّ)')
  expect(carryMarks('رَبِّ')).toBe('رَبِّ')
  expect(splitBidi(carryMarks('فتحة َ')).map(p => p.ar)).toEqual([true])
})
