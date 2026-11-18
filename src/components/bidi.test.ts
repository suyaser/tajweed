import { splitBidi, arDigits } from './bidi'

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
  expect(splitBidi('الضحى · ٥')).toEqual([{ text: 'الضحى · ٥', ar: true }])
  expect(splitBidi('12 reviews')).toEqual([{ text: '12 reviews', ar: false }])
  expect(arDigits(114)).toBe('١١٤')
})
