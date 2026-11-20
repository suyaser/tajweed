import { useEffect, useState } from 'react'
import { getSnapshot, planSession, suggestPassages, updateSession, updateSettings, useData } from '../core/store'
import { today } from '../core/day'
import { getLesson } from '../content'
import { listAll } from '../audio/recordings'
import { navigate } from '../app/router'
import { Button, Card } from '../components'
import type { ScreenProps } from '../app/App'
import { dayLabel, listenHref, live, mergePassages, nextTeacherDay, refLabel, upcomingSession, type Planned } from './path/helpers'
import { AddPassage, ReasonChip } from './path/ui'
import { t } from '../i18n'

/** "Since last time": ranges recorded, and an example ayah of each lesson introduced, since the last finished session. */
async function recentPassages(): Promise<Planned[]> {
  const d = getSnapshot()
  const last = live(d.sessions).filter((s) => s.status === 'done').map((s) => s.on).sort().pop() ?? ''
  let recs: Planned[] = []
  try {
    recs = (await listAll()).filter((r) => r.createdAt.slice(0, 10) >= last && !r.from.startsWith('drill:')).map((r) => ({ from: r.from, to: r.to, reason: 'recent' as const }))
  } catch { /* IndexedDB unavailable */ }
  const lessons: Planned[] = d.introductions
    .filter((i) => i.on >= last)
    .flatMap((i) => getLesson(i.lessonId)?.examples.slice(0, 1) ?? [])
    .map((e) => ({ from: e.verseKey, to: e.verseKey, reason: 'recent' as const }))
  return mergePassages([], [...recs, ...lessons]).slice(0, 4)
}

/** `#/teacher/new` plans the next session; `?id=` edits that one. An upcoming plan is edited, not duplicated. */
export default function TeacherNew({ params }: ScreenProps) {
  const d = useData()
  const on = today()
  const existing = params.id ? d.sessions.find((s) => s.id === params.id) : upcomingSession(d.sessions, on)
  const [date, setDate] = useState(existing?.on ?? nextTeacherDay(d.settings.teacherDays, on) ?? on)
  const [name, setName] = useState(existing?.teacherName ?? d.settings.teacherName ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [passages, setPassages] = useState<Planned[]>(() => mergePassages(existing?.plannedPassages ?? [], suggestPassages()))
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let alive = true
    recentPassages().then((r) => alive && setPassages((p) => mergePassages(p, r)))
    return () => { alive = false }
  }, [])

  const save = () => {
    const patch = { on: date, teacherName: name.trim() || undefined, notes: notes.trim() || undefined, plannedPassages: passages }
    if (name.trim() && name.trim() !== d.settings.teacherName) updateSettings({ teacherName: name.trim() })
    const id = existing ? (updateSession(existing.id, patch), existing.id) : planSession(patch).id
    navigate(`teacher/${id}`)
  }

  return (
    <form className="p-stack" onSubmit={(e) => { e.preventDefault(); save() }}>
      {existing && !params.id && <p className="t-sm muted">{t('You already have a plan for {day}; changes go into it.', { day: dayLabel(existing.on) })}</p>}
      <div className="p-row">
        <label className="p-field">
          <span>{t('Date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || on)} required />
        </label>
        <label className="p-field">
          <span>{t('Teacher')}</span>
          <input type="text" dir="auto" lang="ar" value={name} onChange={(e) => setName(e.target.value)} placeholder="الشيخ…" autoComplete="off" />
        </label>
      </div>

      <Card eyebrow={t('To recite')}>
        {passages.length ? (
          <ol className="p-list">
            {passages.map((p, i) => (
              <li key={`${p.from}-${p.to}`} className="p-item">
                <span className="p-item-main">
                  <ReasonChip p={p} />
                  <a href={listenHref(p.from, p.to)} className="a-lg" lang="ar">{refLabel(p.from, p.to)}</a>
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={t('Remove {name}', { name: refLabel(p.from, p.to) })}
                  onClick={() => setPassages(passages.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">{t('Nothing suggested yet. Add a passage you want to recite.')}</p>
        )}
        {adding ? (
          <AddPassage onAdd={(p) => { setPassages(mergePassages(passages, [p])); setAdding(false) }} />
        ) : (
          <Button variant="ghost" onClick={() => setAdding(true)}>+ {t('Add a passage')}</Button>
        )}
      </Card>

      <label className="p-field">
        <span>{t('Note to self')}</span>
        <textarea dir="auto" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('e.g. ask about ر in مصر')} />
      </label>
      <Button type="submit" block>{t('Save plan')}</Button>

    </form>
  )
}
