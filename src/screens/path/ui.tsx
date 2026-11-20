// Shared pieces for the Teacher and Path screens.
import { useEffect, useState } from 'react'
import type { Verse, VerseKey } from '../../core/types'
import { getSnapshot, planSession, updateSession } from '../../core/store'
import { today } from '../../core/day'
import { ayahCount, getRange, surahName, tajweedSpans, toArabicDigits } from '../../quran'
import { Button, Field, fieldCls, type PassageAyah } from '../../components'
import { navigate } from '../../app/router'
import { t } from '../../i18n'
import type { Planned } from './helpers'

/** Verses of a range, with tajweed segments for <Passage>. `error` when offline and not cached. */
export function useVerses(from?: VerseKey, to?: VerseKey) {
  const [state, set] = useState<{ key: string; verses?: Verse[]; error?: string }>({ key: '' })
  const key = from && to ? `${from}-${to}` : ''
  useEffect(() => {
    if (!from || !to) return
    let alive = true
    getRange(from, to).then(
      (verses) => alive && set({ key, verses }),
      () => alive && set({ key, error: t('The text needs a connection the first time it is opened.') }),
    )
    return () => { alive = false }
  }, [from, to, key])
  const cur = state.key === key ? state : { key }
  const ayahs: PassageAyah[] | undefined = cur.verses?.map((v) => ({
    key: v.verseKey, n: +v.verseKey.split(':')[1], segments: tajweedSpans(v).map((s) => ({ text: s.text, colour: s.colour })),
  }))
  return { verses: cur.verses, ayahs, error: cur.error, loading: !!key && !cur.verses && !cur.error }
}

export const REASON: Record<Planned['reason'], { label: string }> = {
  milestone: { label: t('Unit finale') },
  correction: { label: t('Re-check') },
  recent: { label: t('Since last time') },
  ask: { label: t('Added by you') },
}

/** Surah picker + ayah range. */
export function AddPassage({ onAdd, reason = 'ask' }: { onAdd: (p: Planned) => void; reason?: Planned['reason'] }) {
  // default: the surah of the most recent planned passage, else الفاتحة (m24)
  const [surah, setSurah] = useState(() => {
    const last = [...getSnapshot().sessions].filter((s) => !s.deletedAt).sort((a, b) => (a.on < b.on ? 1 : -1)).find((s) => s.plannedPassages.length)?.plannedPassages.at(-1)
    return last ? +last.from.split(':')[0] : 1
  })
  const [a1, setA1] = useState(1)
  const [a2, setA2] = useState(1)
  const max = ayahCount(surah)
  const from = Math.min(Math.max(1, a1 || 1), max)
  const to = Math.min(Math.max(from, a2 || from), max)
  return (
    <div className="flex flex-col gap-space-sm">
      <Field label={t('Surah')}>
        <select className={fieldCls()} value={surah} onChange={(e) => { setSurah(+e.target.value); setA1(1); setA2(1) }}>
          {Array.from({ length: 114 }, (_, i) => (
            <option key={i} value={i + 1} lang="ar">{`${surahName(i + 1)} (${toArabicDigits(i + 1)})`}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-space-sm">
        <Field label={t('From ayah')}>
          <input className={fieldCls()} type="number" inputMode="numeric" min={1} max={max} value={a1} onChange={(e) => setA1(+e.target.value)} />
        </Field>
        <Field label={t('To ayah')}>
          <input className={fieldCls()} type="number" inputMode="numeric" min={1} max={max} value={a2} onChange={(e) => setA2(+e.target.value)} />
        </Field>
      </div>
      <Button variant="secondary" className="self-start" onClick={() => onAdd({ from: `${surah}:${from}`, to: `${surah}:${to}`, reason })}>{t('Add this passage')}</Button>
    </div>
  )
}

export { download } from '../../app/download'

/** "Start class": the given plan (moved to today), or a plan made on the fly from the suggestions. */
export function startClass(sessionId?: string) {
  const on = today()
  // A class planned for the calendar date keeps it, even between 00:00 and 03:00 when the study day is still yesterday (M13).
  const planned = sessionId && getSnapshot().sessions.find((x) => x.id === sessionId)?.on
  if (sessionId && planned !== today(new Date(Date.now() + 3 * 3600_000))) updateSession(sessionId, { on })
  navigate(`#/teacher/${sessionId ?? planSession({ on }).id}?sheet=1`)
}
