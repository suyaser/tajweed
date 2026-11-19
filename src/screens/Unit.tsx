// #/unit/:unitId (v2 spec §5): intro, lessons, the finale (recite → completeFinale), optional mutun lines.
import { useEffect, useState } from 'react'
import type { ScreenProps } from '../app/App'
import type { MatnLine, Unit as UnitT } from '../core/types'
import { completeFinale, useData } from '../core/store'
import { courseProgress } from '../core/course'
import { getUnit, unitMutun, units } from '../content/course'
import { href } from '../app/router'
import { Button, Card, EmptyState, StarBadge, T } from '../components'
import { getLesson } from '../content'
import { SignInNudge } from '../sync/SignInNudge'
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
  const [justDone, setJustDone] = useState<string | null>(null) // unit id whose finale was just recited here
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
            {justDone === u.id ? <UnitComplete u={u} /> : <>
              {recited && <p className="t-sm">Recited {dayLabel(recited.on)}. You can recite it again any time.</p>}
              {p.open(u) && p.lessonsDone(u) ? (
                <PassageRecite from={u.finale.from} to={u.finale.to} audio={audio} doneLabel="I recited it"
                  onDone={recited ? undefined : () => { audio.stop(); completeFinale(u.id); setJustDone(u.id); window.scrollTo(0, 0) }} />
              ) : (
                <p className="t-sm"><T>{`After the last lesson of this unit, recite ${u.finale.label}. That opens the next unit.`}</T></p>
              )}
            </>}
            <p className="t-sm muted">Self-checked against the reciter. A teacher can listen too: add it to your next session.</p>
          </Card>
        </section>
      )}

      {lines.length > 0 && <Mutun lines={lines} />}
    </div>
  )
}

/** After "I recited it" on a finale (UX M7): the unit is done, the way on, and the sign-in prompt (it hides itself). */
function UnitComplete({ u }: { u: UnitT }) {
  const next = courseProgress(useData(), units).next
  const to = next.kind === 'lesson'
    ? { link: href('learn', next.id), label: `Next lesson: ${getLesson(next.id)?.nameAr ?? ''}` }
    : next.kind === 'finale'
      ? { link: href('unit', next.unit.id), label: `Open unit ${next.unit.n} · ${next.unit.nameAr}` }
      : { link: href('today'), label: 'Back to today' }
  return (
    <div className="s-study s-summary" role="status">
      <StarBadge n={u.n} size={52} state="done" />
      <p className="t-lg">Unit {u.n} complete.</p>
      <p>{next.kind === 'done' ? <T>The course is done. تقبّل الله منك</T> : 'The next unit is open.'}</p>
      <Button block href={to.link}><T>{to.label}</T></Button>
      <SignInNudge />
    </div>
  )
}

const MATN_NAME: Record<MatnLine['matn'], string> = { tuhfa: 'تحفة الأطفال', jazariyya: 'المقدمة الجزرية' }

/** Optional: the matching lines of تحفة الأطفال / الجزرية; memorise = the first half-line shown, tap to reveal the second. */
function Mutun({ lines }: { lines: MatnLine[] }) {
  const [memorise, setMemorise] = useState(false)
  return (
    <Card eyebrow={<>Optional · <span lang="ar">المتون</span></>}>
      <Button variant="secondary" aria-pressed={memorise} onClick={() => setMemorise(!memorise)}>{memorise ? 'Show whole lines' : 'Memorise'}</Button>
      {(['tuhfa', 'jazariyya'] as const).filter((m) => lines.some((l) => l.matn === m)).map((m) => (
      <section key={m} aria-label={MATN_NAME[m]}>
      <h3 className="a-lg" lang="ar">{MATN_NAME[m]}</h3>
      <ol className="p-list u-mutun">
        {lines.filter((l) => l.matn === m).map((l) => (
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
      </section>
      ))}
      {memorise && <p className="t-sm muted">Say the second half from memory, then tap the line to check.</p>}
    </Card>
  )
}
