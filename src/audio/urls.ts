import type { VerseKey } from '../core/types'

const pad3 = (n: string) => n.padStart(3, '0')

/** everyayah.com ayah file: `{folder}/SSSAAA.mp3` (CORS *, Range supported). */
export function ayahUrl(folder: string, verseKey: VerseKey): string {
  const [s, a] = verseKey.split(':')
  return `https://everyayah.com/data/${folder}/${pad3(s)}${pad3(a)}.mp3`
}
