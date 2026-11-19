// @ts-expect-error -- no @types/node; vitest runs in node
import { readFileSync } from 'node:fs'
import { findTargets, lessonsInAyah } from './rulemap'

const surah = (n: number) => JSON.parse(readFileSync(`public/data/surah/${String(n).padStart(3, '0')}.json`, 'utf8'))

test('findTargets marks the words that show a rule', () => {
  const nas = surah(114)
  expect(findTargets(nas[3], 'ikhfa').length).toBeGreaterThan(0) // مِن شَرِّ
  expect(findTargets(nas[0], 'iqlab')).toEqual([])
  expect(lessonsInAyah(surah(113)[0])).toContain('qal-k') // ٱلْفَلَقِ at the stop
})
