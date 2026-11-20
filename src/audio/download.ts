// "Download this unit's audio": fetch every ayah file a unit plays (examples, closing passages, finale) so the
// service worker's CacheFirst 'audio' route keeps it (vite.config.ts). The page only fetches and checks the cache.
import type { Unit, VerseKey } from '../core/types'
import { getLesson } from '../content'
import { courseLesson } from '../content/course'
import { ayahUrl } from './urls'

const keyRange = (from: VerseKey, to: VerseKey): VerseKey[] => {
  const [s, a] = from.split(':').map(Number)
  const [s2, b] = to.split(':').map(Number)
  // ponytail: passages never cross a surah (course.build.test checks closings/finales are in-surah ranges)
  if (s !== s2) return [from, to]
  return Array.from({ length: b - a + 1 }, (_, i) => `${s}:${a + i}` as VerseKey)
}

/** Every ayah the unit plays, plus the basmala (001001) that precedes a surah's first ayah. */
export function unitAyahs(u: Unit): VerseKey[] {
  const keys = new Set<VerseKey>(['1:1'])
  for (const id of u.lessonIds) {
    getLesson(id)?.examples.forEach(e => keys.add(e.verseKey))
    const c = courseLesson(id).closing
    if (c) keyRange(c.from, c.to).forEach(k => keys.add(k))
  }
  if (u.finale) keyRange(u.finale.from, u.finale.to).forEach(k => keys.add(k))
  return [...keys]
}

/** Offline download needs a controlling service worker (production build) and the Cache API. */
export const canDownload = () =>
  typeof caches !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller

/** How many of the urls are already in the 'audio' cache. */
export async function cachedCount(urls: string[]): Promise<number> {
  const c = await caches.open('audio')
  const hits = await Promise.all(urls.map(u => c.match(u)))
  return hits.filter(Boolean).length
}

/** Fetch the missing files 4 at a time (the service worker caches each 200). Resolves to how many failed. */
export async function download(urls: string[], onProgress: (done: number) => void): Promise<number> {
  const c = await caches.open('audio')
  let done = 0, failed = 0
  const queue = [...urls]
  const worker = async () => {
    for (let u = queue.shift(); u; u = queue.shift()) {
      try { if (!(await c.match(u))) { const r = await fetch(u); if (!r.ok) failed++; else await r.arrayBuffer() } }
      catch { failed++ }
      onProgress(++done)
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()])
  return failed
}

export const unitUrls = (u: Unit, folder: string) => unitAyahs(u).map(k => ayahUrl(folder, k))
