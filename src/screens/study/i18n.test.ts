// Every t('…') / tn('…', '…') key used by the study and path screens has an Arabic entry (study.json, or library.json
// and the other dictionaries for keys other screens own).
import { AR } from '../../i18n'

const sources = import.meta.glob<string>(
  ['../{Today,Learn,Review,Unit,Plan,Progress,Onboarding,Guide}.tsx', '../{study,path,guide}/*.{ts,tsx}', '!../**/*.test.*', '../../core/questions.ts'],
  { query: '?raw', import: 'default', eager: true },
)

const STR = `'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)"`
const CALL = new RegExp(`\\btn?\\(\\s*(?:${STR})(?:\\s*,\\s*(?:${STR}))?`, 'g')
const unescape = (s: string) => s.replace(/\\(.)/g, '$1')

function keys(code: string): string[] {
  const out: string[] = []
  for (const m of code.matchAll(CALL)) {
    const [, a, b, c, d] = m
    out.push(unescape(a ?? b))
    if (m[0].startsWith('tn') && (c ?? d) != null) out.push(unescape(c ?? d))
  }
  return out
}

import guide from '../../../content/guide.json'

// The Guide's texts (content/guide.json): every English string is a t() key.
const GUIDE = [
  ...guide.basics.flatMap((b) => [b.en, b.body]),
  ...guide.sections.flatMap((s) => [s.en, ...(s.blocks as { text?: string; lead?: string; tail?: string; levels?: string[]; items?: { text: string }[] }[]).flatMap((b) => [b.text, b.lead, b.tail, ...(b.levels ?? []), ...(b.items ?? []).map((i) => i.text)])]),
].filter((k): k is string => !!k)

test('content/guide.json: every key has an Arabic entry', () => {
  expect(GUIDE.length).toBeGreaterThan(40)
  expect(GUIDE.filter((k) => !(k in AR))).toEqual([])
})

test('finds keys (sanity)', () => {
  expect(keys(`t('a'), tn('{n} day', "{n} days", n), t("it's"), t('don\\'t')`)).toEqual(['a', '{n} day', '{n} days', "it's", "don't"])
  expect(Object.keys(sources).length).toBeGreaterThan(20)
})

test.each(Object.keys(sources))('%s: every t() key has an Arabic entry', (f) => {
  expect(keys(sources[f]).filter(k => !(k in AR))).toEqual([])
})
