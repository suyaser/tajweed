// #/plan: the course map (v2 spec §5): units as a vertical path, each with its lessons, finale and a link to the unit.
import { useData } from '../core/store'
import { courseProgress } from '../core/course'
import { units } from '../content/course'
import { href } from '../app/router'
import { StarBadge } from '../components'
import { PathTabs, UnitLessons } from './path/ui'
import { Hint } from './study/Hint'
import './path.css'

export default function Plan() {
  const d = useData()
  const p = courseProgress(d, units)
  const current = p.next.kind === 'done' ? null : p.next.unit
  return (
    <div className="p-stack">
      <PathTabs value="plan" />
      <Hint id="plan">The course, unit by unit. Lessons open one after another; each unit ends with a finale passage you recite, which opens the next unit.</Hint>
      <ol className="p-timeline">
        {units.map((u) => {
          const complete = p.lessonsDone(u) && p.finaleDone(u)
          const status = complete ? 'passed' : p.open(u) ? 'active' : 'locked'
          const n = u.lessonIds.filter((id) => p.done.has(id)).length
          return (
            <li key={u.id} className="p-phase" data-status={status}>
              <details open={u === current || undefined}>
                <summary>
                  <StarBadge n={u.n} size={44} state={complete ? 'done' : status === 'active' ? 'active' : 'locked'} />
                  <span className="p-phase-title">
                    <span className="a-lg" lang="ar">{u.nameAr}</span>
                    <span className="t-sm muted">{u.nameEn}</span>
                  </span>
                  <span className="p-status t-sm num" data-status={status}>
                    {complete ? '✓ done' : status === 'locked' ? 'locked' : u.lessonIds.length ? `${n} of ${u.lessonIds.length}` : 'finale'}
                  </span>
                </summary>
                <div className="p-phase-body">
                  <UnitLessons u={u} p={p} />
                  <a className="p-link" href={href('unit', u.id)}>Open the unit ›</a>
                </div>
              </details>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
