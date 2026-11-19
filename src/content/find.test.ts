// @ts-expect-error -- no @types/node; vitest runs in node
import { readFileSync } from 'node:fs'
import { findTargets, lessonsInAyah } from './rulemap'

const surah = (n: number) => JSON.parse(readFileSync(`public/data/surah/${String(n).padStart(3, '0')}.json`, 'utf8'))
const ayah = (k: string) => { const [s, a] = k.split(':').map(Number); return surah(s)[a - 1] }

test('findTargets marks the words that show a rule', () => {
  const nas = surah(114)
  expect(findTargets(nas[3], 'ikhfa').length).toBeGreaterThan(0) // مِن شَرِّ
  expect(findTargets(nas[0], 'iqlab')).toEqual([])
  expect(lessonsInAyah(surah(113)[0])).toContain('qal-k') // ٱلْفَلَقِ at the stop
})

test('a rule across two words is marked on the word whose ending changes', () => {
  expect(findTargets(ayah('113:4'), 'sakinayn')).toEqual([4]) // فِى (ٱلْعُقَدِ): the ى drops
  expect(findTargets(ayah('98:1'), 'sakinayn')).toContain(2) // يَكُنِ ٱلَّذِينَ
  expect(findTargets(ayah('99:1'), 'sakinayn')).toEqual([2]) // زُلْزِلَتِ ٱلْأَرْضُ: تاء التأنيث takes a كسرة
  expect(lessonsInAyah(ayah('113:4'))).toContain('sakinayn')
  expect(findTargets(ayah('110:3'), 'silah-s')).toEqual([5]) // إِنَّهُۥ كَانَ
  expect(findTargets(ayah('2:258'), 'silah-s')).toEqual([]) // يُحْىِۦ وَيُمِيتُ: the ۦ is not a pronoun's
  expect(findTargets(ayah('79:18'), 'mithlayn')).toEqual([2]) // هَل لَّكَ
})

test('at the stop the مد before the last letter is العارض, not الطبيعي (tabii lesson)', () => {
  expect(findTargets(ayah('1:4'), 'tabii')).toEqual([1]) // مَٰلِكِ; not ٱلدِّينِ at the stop
  expect(findTargets(ayah('1:4'), 'arid')).toEqual([3])
})
