// Read-only teacher view of a learner's progress (#/shared/:token). No account, no onboarding, no nav.
import { useEffect, useState } from 'react'
import { Card, OrnHeading, Skeleton } from '../components'
import { getLesson } from '../content'
import course from '../../content/course.json'
import { supabase } from '../sync/supabase'
import './path.css'
import '../sync/sync.css'

interface Summary {
  teacherName: string | null
  lessons: { lessonId: string; on: string; step: number | null; state: string | null }[]
  finales: { unitId: string; on: string }[]
  corrections: { verseKey: string; word: string | null; note: string | null; severity: string | null; on: string | null }[]
  days: string[]
}

const units = new Map((course as { units: { id: string; n: number; nameEn: string; nameAr: string }[] }).units.map((u) => [u.id, u]))
const fmt = (d: string) => {
  try { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')) } catch { return d }
}

export default function Shared({ params }: { params: Record<string, string> }) {
  const [data, setData] = useState<Summary | null | undefined>(undefined)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!supabase) { setErr('This version of the app cannot open shared progress.'); return }
    if (!/^[0-9a-f-]{36}$/i.test(params.token ?? '')) { setData(null); return }
    supabase.rpc('shared_progress', { p_token: params.token }).then(
      ({ data, error }) => (error ? setErr(error.message) : setData((data as Summary | null) ?? null)),
      (e) => setErr((e as Error).message),
    )
  }, [params.token])

  if (err) return <Card><p role="alert">Could not load this progress: {err}. Check your connection and try again.</p></Card>
  if (data === undefined) return <Skeleton lines={6} label="Loading progress…" />
  if (data === null) return <Card><p>This link is not valid any more. The learner may have turned it off; ask them for a new one.</p></Card>

  return (
    <div className="p-stack">
      <OrnHeading>Shared progress</OrnHeading>
      <p className="muted t-sm">
        A read-only summary a learner shared{data.teacherName ? <> with <bdi>{data.teacherName}</bdi></> : null}. It shows lessons, open corrections and
        study days; nothing here can be changed.
      </p>

      <Card eyebrow={`Studied ${data.days.length} of the last 30 days`}>
        {data.days.length ? <p className="t-sm">{data.days.slice(-14).map(fmt).join(' · ')}</p> : <p className="muted">No study days in the last 30 days.</p>}
      </Card>

      <Card eyebrow={`Lessons done (${data.lessons.length})`}>
        {data.lessons.length ? (
          <ul className="shared-list">
            {data.lessons.map((l) => {
              const lesson = getLesson(l.lessonId)
              return (
                <li key={l.lessonId}>
                  <span>{lesson ? <><span lang="ar" className="a-sm">{lesson.nameAr}</span> <small className="muted">{lesson.nameEn}</small></> : l.lessonId}</span>
                  <small className="muted">{fmt(l.on)}{l.step != null ? ` · level ${l.step}` : ''}</small>
                </li>
              )
            })}
          </ul>
        ) : <p className="muted">No lessons yet.</p>}
      </Card>

      {data.finales.length > 0 && (
        <Card eyebrow="Unit finales recited">
          <ul className="shared-list">
            {data.finales.map((f) => {
              const u = units.get(f.unitId)
              return <li key={f.unitId}><span>{u ? `Unit ${u.n}: ${u.nameEn}` : f.unitId}</span><small className="muted">{fmt(f.on)}</small></li>
            })}
          </ul>
        </Card>
      )}

      <Card eyebrow={`Open corrections (${data.corrections.length})`}>
        {data.corrections.length ? (
          <ul className="shared-list">
            {data.corrections.map((c, i) => (
              <li key={i}>
                <span>
                  <b>{c.verseKey}</b>{c.word && <> · <span lang="ar" className="a-sm">{c.word}</span></>}
                  {c.note && <><br /><small dir="auto">{c.note}</small></>}
                </span>
                <small className="muted">{c.severity === 'jali' ? 'clear mistake' : c.severity === 'khafi' ? 'subtle mistake' : ''}{c.on ? ` · ${fmt(c.on)}` : ''}</small>
              </li>
            ))}
          </ul>
        ) : <p className="muted">No open corrections.</p>}
      </Card>
    </div>
  )
}
