// #/unit/:unitId (v2 spec §5): intro, lessons, the finale (recite → completeFinale), optional mutun lines.
import { useEffect, useState } from 'react'
import type { ScreenProps } from '../app/App'
import type { MatnLine } from '../core/types'
import { completeFinale, useData } from '../core/store'
import { courseProgress } from '../core/course'
import { getUnit, unitMutun, units } from '../content/course'
import { href } from '../app/router'
import { Button, Card, EmptyState, StarBadge, T } from '../components'
import { UnitLessons } from './path/ui'
import { dayLabel } from './path/helpers'
import { PassageRecite } from './study/Recorder'
import { useStudyAudio } from './study/verse'
import './path.css'
import './study.css'

export default function Unit({ params }: ScreenProps) {
  const u = getUnit(params.unitId)
  const d = useData()
  const audio = useStudyAudio()
  useEffect(() => { if (params.finale) document.getElementById('finale')?.scrollIntoView() }, [params.finale])
  if (!u) return <EmptyState title="This unit isn't in the course." action={<Button href={href('plan')}>Course map</Button>} />
  const p = courseProgress(d, units)
  const lines = unitMutun(u)
  const recited = d.finales.find((f) => f.unitId === u.id)
  const prev = units[units.indexOf(u) - 1]

  return (
    <div className="p-stack">
      <header className="p-row-inline">
        <StarBadge n={u.n} size={52} state={p.lessonsDone(u) && p.finaleDone(u) ? 'done' : p.open(u) ? 'active' : 'locked'} />
        <div>
          <h1 className="a-h2" lang="ar">{u.nameAr}</h1>
          <p className="muted">Unit {u.n} · {u.nameEn}</p>
        </div>
      </header>
      <p><T>{u.intro}</T></p>
      {!p.open(u) && prev && <Card className="s-note"><p><T>{`This unit opens after the finale of unit ${prev.n} · ${prev.nameAr}.`}</T></p></Card>}

      {u.lessonIds.length > 0 && <Card eyebrow="Lessons"><UnitLessons u={u} p={p} /></Card>}

      {u.finale && (
        <section id="finale" aria-label="Unit finale">
          <Card eyebrow={<>Finale · <span lang="ar">{u.finale.label}</span></>}>
            {recited && <p className="t-sm">Recited {dayLabel(recited.on)}. You can recite it again any time.</p>}
            {p.open(u) && p.lessonsDone(u) ? (
              <PassageRecite from={u.finale.from} to={u.finale.to} audio={audio} doneLabel="I recited it" onDone={recited ? undefined : () => completeFinale(u.id)} />
            ) : (
              <p className="t-sm"><T>{`After the last lesson of this unit, recite ${u.finale.label} from start to end. That opens the next unit.`}</T></p>
            )}
            <p className="t-sm muted">Self-checked against the reciter. A teacher can listen too: add it to your next session.</p>
          </Card>
        </section>
      )}

      {lines.length > 0 && <Mutun lines={lines} />}
    </div>
  )
}

/** Optional: the matching lines of تحفة الأطفال / الجزرية; memorise = the first half-line shown, tap to reveal the second. */
function Mutun({ lines }: { lines: MatnLine[] }) {
  const [memorise, setMemorise] = useState(false)
  return (
    <Card eyebrow={<>Optional · <span lang="ar">المتون</span></>}>
      <Button variant="secondary" aria-pressed={memorise} onClick={() => setMemorise(!memorise)}>{memorise ? 'Show whole lines' : 'Memorise'}</Button>
      <ol className="p-list u-mutun">
        {lines.map((l) => (
          <li key={l.id} className="p-item p-item-col">
            {memorise ? (
              <details>
                <summary lang="ar" dir="rtl" className="a-lg">{l.sadr}</summary>
                <p lang="ar" dir="rtl" className="a-lg">{l.ajz}</p>
              </details>
            ) : (
              <p lang="ar" dir="rtl" className="a-lg">{l.sadr}<br />{l.ajz}</p>
            )}
            {l.gloss && !memorise && <p className="t-sm muted"><T>{l.gloss}</T></p>}
          </li>
        ))}
      </ol>
      {memorise && <p className="t-sm muted">Say the second half from memory, then tap the line to check.</p>}
    </Card>
  )
}
