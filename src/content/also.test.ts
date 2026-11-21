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
    // fixed cases from the tajweed review, built from the Quran data (independent of which words the lessons use)
    const also = (lessonId: string, key: string, from: number, to: number, stopping: boolean) => {
      const [s, a] = key.split(':').map(Number)
      const v = surah(s)[a - 1]
      const ex = { id: 'x', lessonId, verseKey: key, wordFrom: from, wordTo: to, text: v.words.slice(from - 1, to).join(' '), focus: '', stopping }
      return alsoLessons(ex, v, [])
    }
    expect(also('qal-k', '113:1', 4, 4, true)).toContain('lam-q') // ٱلْفَلَقِ
    expect(also('lam-q', '113:1', 4, 4, true)).toContain('qal-k')
    expect(also('ra-l', '2:20', 25, 25, true)).toContain('arid') // قَدِيرٌ stopping: مد before the last letter
    expect(also('ra-h', '105:4', 1, 1, false)).toContain('m-ikhfa') // تَرْمِيهِم: مْ before بِحِجَارَةٍ
    expect(also('ra-h', '89:28', 1, 1, false)).toContain('munfasil') // ٱرْجِعِىٓ إِلَىٰ
    expect(also('ra-l', '24:37', 1, 1, false)).toContain('idgh-n') // رِجَالٌ لَّا
  })
})
