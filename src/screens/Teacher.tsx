import { useState } from 'react'
import { useData } from '../core/store'
import { today } from '../core/day'
import { getLesson } from '../content'
import { Button, Card, CorrectionTag, EmptyState, OrnHeading, SegmentedControl, T } from '../components'
import { corrLabel, dayLabel, listenHref, live, nextTeacherDay, severityCounts, upcomingSession } from './path/helpers'
import { startClass } from './path/ui'
import './path.css'
import { Hint } from './study/Hint'

export default function Teacher() {
  const d = useData()
  const [filter, setFilter] = useState<'all' | 'open'>('all')
  const on = today()
  const next = upcomingSession(d.sessions, on)
  const teacherDay = nextTeacherDay(d.settings.teacherDays, on)
  const sessions = live(d.sessions).filter((s) => s !== next).sort((a, b) => (a.on < b.on ? 1 : -1))
  const open = live(d.corrections).filter((c) => c.status === 'open').sort((a, b) => (a.severity === b.severity ? (a.createdAt < b.createdAt ? 1 : -1) : a.severity === 'jali' ? -1 : 1))

  return (
    <div className="p-stack">
      <Hint id="teacher">Plan each class here, log your teacher’s corrections during it, and re-check them next time. Corrections come back in your daily review.</Hint>
      <Card level="e2" eyebrow={next ? `Next session · ${dayLabel(next.on)}` : teacherDay ? `Next teacher day · ${dayLabel(teacherDay)}` : 'Next session'}>
        {next ? (
          <>
            <p>
              {next.teacherName || d.settings.teacherName ? <bdi lang="ar" className="a">{next.teacherName || d.settings.teacherName}</bdi> : 'Your teacher'} · {next.plannedPassages.length}{' '}
              {next.plannedPassages.length === 1 ? 'passage' : 'passages'}
            </p>
            <div className="p-actions">
              <Button variant="secondary" href={`#/teacher/${next.id}`}>Open plan</Button>
              <Button onClick={() => startClass(next.id)}>Start class</Button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">No plan yet. The app suggests what to recite: milestones, open corrections and what you practised.</p>
            <div className="p-actions">
              <Button href="#/teacher/new">Plan a session</Button>
              <Button variant="secondary" onClick={() => startClass()}>Start class now</Button>
            </div>
          </>
        )}
      </Card>

      <SegmentedControl
        label="Show"
        value={filter}
        onChange={setFilter}
        options={[{ value: 'all', label: 'All' }, { value: 'open', label: `Open corrections ${open.length}` }]}
      />

      {filter === 'open' ? (
        open.length ? (
          <ul className="p-list" aria-label="Open corrections">
            {open.map((c) => (
              <li key={c.id} className="p-item">
                <div className="p-item-main">
                  <a href={listenHref(c.verseKey)} className="a-lg" lang="ar">{corrLabel(c)}</a>
                  <span className="t-sm muted">
                    <T>{c.lessonIds.map((l) => getLesson(l)?.nameAr ?? l).join('، ') || 'No rule tagged'}</T>
                    {c.note ? <> · <bdi dir="auto">{c.note}</bdi></> : null} · since {dayLabel(c.on ?? c.createdAt.slice(0, 10))}
                  </span>
                </div>
                <CorrectionTag severity={c.severity} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No open corrections.">When your teacher corrects something, it stays here until they say it is fixed.</EmptyState>
        )
      ) : (
        <>
          <OrnHeading>History</OrnHeading>
          {sessions.length ? (
            <ul className="p-list" aria-label="Sessions">
              {sessions.map((s) => {
                const n = severityCounts(d.corrections, s.id)
                return (
                  <li key={s.id}>
                    <a className="p-item p-item-link" href={`#/teacher/${s.id}`}>
                      <span className="p-item-main">
                        <b>{dayLabel(s.on)}</b>
                        <span className="t-sm muted">
                          {s.status === 'planned' ? 'Planned, not finished' : s.teacherName ? <bdi lang="ar" className="a">{s.teacherName}</bdi> : 'Session'}
                        </span>
                      </span>
                      <span className="p-tags">
                        {n.jali > 0 && <CorrectionTag severity="jali" count={n.jali} />}
                        {n.khafi > 0 && <CorrectionTag severity="khafi" count={n.khafi} />}
                        {!n.jali && !n.khafi && s.status === 'done' && <span className="t-sm muted">no corrections</span>}
                      </span>
                      <span className="chev" aria-hidden="true">›</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : next ? null : (
            <p className="muted">No past sessions yet. They appear here after your first class.</p>
          )}
          {sessions.length > 0 && <Button variant="secondary" block href="#/teacher/new">+ Plan a session</Button>}
        </>
      )}
    </div>
  )
}
