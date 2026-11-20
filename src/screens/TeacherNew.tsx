import { useEffect, useState } from 'react'
import { getSnapshot, planSession, suggestPassages, updateSession, updateSettings, useData } from '../core/store'
import { today } from '../core/day'
import { getLesson } from '../content'
import { listAll } from '../audio/recordings'
import { navigate } from '../app/router'
import { Button, Field, Group, Msg, fieldCls } from '../components'
import { Page } from '@/components/kit'
import { Icon } from '@/components/ui/icon'
import { Item, ReasonTag, refCls } from './library/teacher'
import type { ScreenProps } from '../app/App'
import { dayLabel, listenHref, live, mergePassages, nextTeacherDay, refLabel, upcomingSession, type Planned } from './path/helpers'
import { AddPassage } from './path/ui'
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
    <Page width="narrow">
      <form className="flex flex-col gap-space-lg" onSubmit={(e) => { e.preventDefault(); save() }}>
        {existing && !params.id && <Msg className="text-on-surface-variant">{t('You already have a plan for {day}; changes go into it.', { day: dayLabel(existing.on) })}</Msg>}
        <div className="grid gap-space-md sm:grid-cols-2">
          <Field label={t('Date')}>
            <input type="date" className={fieldCls()} value={date} onChange={(e) => setDate(e.target.value || on)} required />
          </Field>
          <Field label={t('Teacher')}>
            <input type="text" dir="auto" lang="ar" className={fieldCls()} value={name} onChange={(e) => setName(e.target.value)} placeholder="الشيخ…" autoComplete="off" />
          </Field>
        </div>

        <Group en="To recite" ar="للتلاوة">
          {passages.length ? (
            <ol className="flex flex-col divide-y divide-outline-variant">
              {passages.map((p, i) => (
                <Item key={`${p.from}-${p.to}`} end={
                  <button type="button" aria-label={t('Remove {name}', { name: refLabel(p.from, p.to) })}
                    onClick={() => setPassages(passages.filter((_, j) => j !== i))}
                    className="grid size-12 cursor-pointer place-items-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-error">
                    <Icon name="close" />
                  </button>
                }>
                  <ReasonTag p={p} />
                  <a href={listenHref(p.from, p.to)} className={refCls} lang="ar">{refLabel(p.from, p.to)}</a>
                </Item>
              ))}
            </ol>
          ) : (
            <p className="p-space-md text-on-surface-variant">{t('Nothing suggested yet. Add a passage you want to recite.')}</p>
          )}
          <div className="p-space-md">
            {adding ? (
              <AddPassage onAdd={(p) => { setPassages(mergePassages(passages, [p])); setAdding(false) }} />
            ) : (
              <Button variant="ghost" onClick={() => setAdding(true)}><Icon name="add" size={20} />{t('Add a passage')}</Button>
            )}
          </div>
        </Group>

        <Field label={t('Note to self')}>
          <textarea dir="auto" rows={2} className={fieldCls('h-auto py-space-sm')} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('e.g. ask about ر in مصر')} />
        </Field>

          <Button type="submit" block><Icon name="check" size={20} />{t('Save plan')}</Button>

      </form>
    </Page>
  )
}
