import { useState } from 'react'
import type { Phase, PhaseProgress, UserData } from '../core/types'
import { setPhaseStatus, skipPhase, toggleTask, useData } from '../core/store'
import { diffDays, today } from '../core/day'
import { levelOf } from '../core/scheduler'
import { getLesson, phases as contentPhases } from '../content'
import { Button, Card, RuleChip, Sheet, StarBadge, T } from '../components'
import { dayLabel, listenHref, passedMilestones } from './path/helpers'
import { AddToNextSession, PathTabs } from './path/ui'
import './path.css'
import { Hint } from './study/Hint'

const STATUS: Record<PhaseProgress['status'], string> = {
  locked: '🔒 locked', active: '● active', milestone: '◆ ready for the milestone', passed: '✓ passed', skipped: '↷ skipped',
}
const SKIP_AFTER = 14

export default function Plan() {
  const d = useData()
  return (
    <div className="p-stack">
      <PathTabs value="plan" />
      <Hint id="plan">Your six phases. Open a phase to see its lessons, its tasks to tick, and the milestone passages to recite to your teacher.</Hint>
      <ol className="p-timeline">
        {contentPhases.map((ph) => (
          <PhaseRow key={ph.id} ph={ph} pr={d.phases.find((p) => p.id === ph.id)} d={d} />
        ))}
      </ol>
    </div>
  )
}

function PhaseRow({ ph, pr, d }: { ph: Phase; pr?: PhaseProgress; d: UserData }) {
  const status = pr?.status ?? 'locked'
  const on = today()
  const star = status === 'passed' ? 'done' : status === 'locked' ? 'locked' : 'active'
  const current = status === 'active' || status === 'milestone'
  const introduced = new Set(d.introductions.map((i) => i.lessonId))
  const passed = passedMilestones(d.sessions)
  const allPassed = ph.milestone.length > 0 && ph.milestone.every((m) => passed.has(`${ph.id}/${m.id}`))
  const lastPassed = ph.milestone.map((m) => passed.get(`${ph.id}/${m.id}`)).filter(Boolean).sort((a, b) => (a!.on < b!.on ? 1 : -1))[0]
  const when = status === 'passed' && pr?.passedOn ? ` ${dayLabel(pr.passedOn)}` : status === 'skipped' && pr?.skipReason ? ` · ${pr.skipReason}` : ''

  return (
    <li className="p-phase" data-status={status}>
      <details open={current || undefined}>
        <summary>
          <StarBadge n={ph.id} size={44} state={star} />
          <span className="p-phase-title">
            <span className="a-lg" lang="ar">{ph.nameAr}</span>
            <span className="t-sm muted">{ph.nameEn}</span>
          </span>
          <span className="p-status t-sm" data-status={status}>{STATUS[status]}{when}</span>
        </summary>
        <div className="p-phase-body">
          <p className="t-sm muted">{ph.weeks}</p>
          <p><T>{ph.goal}</T></p>
          <p className="t-sm"><T>{`Done when: ${ph.doneWhen}`}</T></p>
          {status === 'passed' && lastPassed?.teacherName && (
            <p className="t-sm">Passed with <bdi lang="ar" className="a">{lastPassed.teacherName}</bdi> on {dayLabel(lastPassed.on)}.</p>
          )}

          {ph.lessonIds.length > 0 && (
            <div>
              <p className="t-sm">Lessons {ph.lessonIds.filter((id) => introduced.has(id)).length} of {ph.lessonIds.length} introduced</p>
              <div className="p-chips">
                {ph.lessonIds.map((id) => {
                  const l = getLesson(id)
                  if (!l) return null
                  const level = levelOf(d.items.find((i) => i.kind === 'lesson' && i.refId === id), d.attempts, d.corrections, on)
                  return <RuleChip key={id} nameAr={l.nameAr} level={level} href={`#/rules/${id}`} />
                })}
              </div>
            </div>
          )}

          {ph.milestone.length > 0 && <Milestone ph={ph} status={status} passed={passed} pr={pr} />}

          {allPassed && status !== 'passed' && status !== 'locked' && (
            <Button onClick={() => setPhaseStatus(ph.id, 'passed')}>Mark phase passed and open the next</Button>
          )}

          {ph.tasks.length > 0 && (
            <fieldset className="p-tasks">
              <legend className="t-sm">Tasks <span className="muted">(not counted toward mastery)</span></legend>
              {ph.tasks.map((t, i) => (
                <label key={i} className="p-check">
                  <input type="checkbox" checked={!!pr?.tasksDone.includes(i)} onChange={() => toggleTask(ph.id, i)} />
                  <span><T>{t}</T></span>
                </label>
              ))}
            </fieldset>
          )}
          {status === 'milestone' && pr?.milestoneOn && <SoftGate ph={ph} since={pr.milestoneOn} on={on} />}
        </div>
      </details>
    </li>
  )
}

function Milestone({ ph, status, passed, pr }: { ph: Phase; status: PhaseProgress['status']; passed: ReturnType<typeof passedMilestones>; pr?: PhaseProgress }) {
  return (
    <Card level="e2" eyebrow={<T>Milestone · عرض المرحلة</T>}>
      {status === 'skipped' && <p className="t-sm">The milestone stays on every session plan until you pass it.</p>}
      <ul className="p-list">
        {ph.milestone.map((m) => {
          const s = passed.get(`${ph.id}/${m.id}`)
          return (
            <li key={m.id} className="p-item p-item-col">
              <span className="p-item-main">
                <span className="a-lg" lang="ar">{m.label}</span>
                {s ? <span className="t-sm"><span aria-hidden="true">★ </span>passed {dayLabel(s.on)}</span> : <span className="p-pill">Not yet</span>}
              </span>
              {!s && pr && pr.status !== 'locked' && (
                <span className="p-actions">
                  <Button variant="secondary" href={listenHref(m.from, m.to)}>Listen</Button>
                  <AddToNextSession p={{ from: m.from, to: m.to, reason: 'milestone' }} />
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="t-sm muted">
        This is a milestone check, not an ijazah. An ijazah is given by a teacher with a sanad after a full khatma.
      </p>
    </Card>
  )
}

/** F7 soft gate: after 14 days in `milestone`, continue with a short reason. */
function SoftGate({ ph, since, on }: { ph: Phase; since: string; on: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const left = SKIP_AFTER - diffDays(on, since)
  const next = contentPhases.find((p) => p.id === ph.id + 1)
  if (left > 0)
    return <p className="t-sm muted">If your teacher is away, you can continue without the milestone in {left} {left === 1 ? 'day' : 'days'}.</p>
  return (
    <>
      <button type="button" className="p-linkbtn" onClick={() => setOpen(true)}>Continue without the milestone</button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Continue without the milestone">
        <form className="p-stack" onSubmit={(e) => { e.preventDefault(); if (reason.trim()) { skipPhase(ph.id, reason.trim()); setOpen(false) } }}>
          <label className="p-field">
            <span>Why? (a short reason)</span>
            <input type="text" dir="auto" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="teacher away" required maxLength={80} />
          </label>
          <p className="t-sm">The milestone stays on every session plan until you pass it.</p>
          <Button type="submit" block disabled={!reason.trim()}>
            {next ? <T>{`Continue to phase ${next.id} · ${next.nameAr}`}</T> : 'Continue'}
          </Button>
        </form>
      </Sheet>
    </>
  )
}
