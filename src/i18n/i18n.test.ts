import { t, pick, lang } from '.'

test('english by default in tests, placeholders filled', () => {
  expect(lang).toBe('en')
  expect(t('{n} days', { n: 3 })).toBe('3 days')
  expect(t('Untranslated')).toBe('Untranslated')
  expect(pick('a', 'ب')).toBe('a')
})
