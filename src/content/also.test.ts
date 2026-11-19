// also.json is generated from public/data by this test: `UPDATE_ALSO=1 npx vitest run src/content/also.test.ts`.
// @ts-expect-error -- no @types/node in this project; vitest runs in node from the repo root.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Verse } from '../core/types'
import { lessons } from './index'
import { alsoLessons } from './rulemap'
import stored from './also.json'

declare const process: { env: Record<string, string | undefined> }
const surah = (n: number): Verse[] => JSON.parse(readFileSync(`public/data/surah/${String(n).padStart(3, '0')}.json`, 'utf8'))

function compute(): Record<string, string[]> {
  const all = lessons.flatMap(l => l.examples)
  const cache = new Map<number, Verse[]>()
  const out: Record<string, string[]> = {}
  for (const ex of all) {
    const [s, a] = ex.verseKey.split(':').map(Number)
    if (!cache.has(s)) cache.set(s, surah(s))
    const ids = alsoLessons(ex, cache.get(s)![a - 1], all.filter(o => o.id !== ex.id))
    if (ids.length) out[ex.id] = ids
  }
  return out
}

describe.skipIf(!existsSync('public/data/surah/001.json'))('also.json', () => {
  it('is in sync with public/data and the content (run with UPDATE_ALSO=1 to regenerate)', () => {
    const now = compute()
    if (process.env.UPDATE_ALSO) writeFileSync('src/content/also.json', JSON.stringify(now, null, 1) + '\n')
    else expect(stored).toEqual(now)
  })

  it('covers the tajweed review cases', () => {
    const now = compute()
    const find = (lessonId: string, text: string) => lessons.find(l => l.id === lessonId)!.examples.find(e => e.text === text)!.id
    expect(now[find('qal-k', 'ٱلْفَلَقِ')]).toContain('lam-q') // same word as lam-q
    expect(now[find('lam-q', 'ٱلْفَلَقِ')]).toContain('qal-k')
    expect(now[find('ra-l', 'قَدِيرٌ')]).toContain('arid') // stopping: مد before the last letter
    expect(now[find('ra-h', 'تَرْمِيهِم')]).toContain('m-ikhfa') // مْ before بِحِجَارَةٍ
    expect(now[find('ra-h', 'ٱرْجِعِىٓ')]).toContain('munfasil')
    expect(now[find('ra-l', 'رِجَالٌ')]).toContain('idgh-n')
  })
})
