import { AR } from '.'
import library from './ar/library.json'

// Every t('…') literal in the library/teacher/settings/shell side of the app has an Arabic entry (library.json, or study.json for shared phrases).
const SOURCES = import.meta.glob<string>([
  '../screens/{Rules,Rule,Listen,Resources,Teacher,TeacherNew,Session,Settings,Account,Circle,Shared,_placeholders}.tsx',
  '../{components,components/kit,components/ui,app,sync,audio,screens/library}/*.{ts,tsx}', '!**/*.test.{ts,tsx}',
], { query: '?raw', import: 'default', eager: true })
// Keys reached through a variable: t(word), t(WEEK_LONG[i]), …
const DYNAMIC = [
  'not started', 'learning', 'known', 'strong', 'studied', 'future', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri',
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'playing', 'marked', 'found', 'missed', 'not this rule',
  'pause mark: continuing is better', 'pause mark: stopping is better', 'pause mark: stop', 'pause mark: do not stop',
  'pause mark: stopping allowed', 'pause mark: stop at one of the pair', 'pause mark: sakt', 'prostration mark', 'pause mark',
  'Found', 'Missed', 'Not this one',
]

const LIT = /\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1/g
const literals = (src: string) => [...src.matchAll(LIT)].map((m) => m[2].replace(/\\(['"\\])/g, '$1'))

test('every t() literal in these files has an Arabic translation', () => {
  const keys = new Set([...Object.values(SOURCES).flatMap(literals), ...DYNAMIC])
  expect(Object.keys(SOURCES).length).toBeGreaterThan(30)
  expect(keys.size).toBeGreaterThan(300)
  expect([...keys].filter((k) => !AR[k])).toEqual([])
})

test('placeholders survive translation', () => {
  const bad = Object.entries(library as Record<string, string>).filter(([en, ar]) =>
    (en.match(/\{\w+\}/g) ?? []).sort().join() !== (ar.match(/\{\w+\}/g) ?? []).sort().join())
  expect(bad).toEqual([])
})
