// Pure helpers shared by scripts/build-quran-data.mjs (Node strips the types) and the app.
// Keep this file free of runtime imports so Node can load it directly.
import type { Verse } from '../core/types'


/** Basmala as it prefixes ayah 1 in the pinned Tanzil text (trailing space included).
 * Escaped: Tanzil orders shadda before fatha, which editors silently reorder. */
export const BASMALA_PREFIX = '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650 '

type Span = Verse['tajweed'][number]

/**
 * Strip the basmala from ayah 1 of every surah except 1 and 9, shifting code-point offsets.
 * Spans that start inside the removed basmala are dropped.
 */
export function stripBasmala(surah: number, ayah: number, text: string, spans: Span[]): { text: string; tajweed: Span[] } {
  if (ayah !== 1 || surah === 1 || surah === 9) return { text, tajweed: spans }
  // 95:1 and 97:1 write بِّسْمِ (shadda: idgham with the previous surah's last ب), so allow it.
  const prefix = text.startsWith('\u0628\u0651') ? '\u0628\u0651' + BASMALA_PREFIX.slice(1) : BASMALA_PREFIX
  if (!text.startsWith(prefix)) throw new Error(`${surah}:1 does not start with the basmala`)
  const cut = Array.from(prefix).length
  return {
    text: Array.from(text).slice(cut).join(''),
    tajweed: spans.filter((s) => s.start >= cut).map((s) => ({ ...s, start: s.start - cut, end: s.end - cut })),
  }
}
