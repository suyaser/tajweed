// #/unit/:unitId (v2 spec §5): intro, lessons, the finale (recite → completeFinale), optional mutun lines.
import { useEffect, useState } from 'react'
import type { ScreenProps } from '../app/App'
import type { MatnLine, Unit as UnitT } from '../core/types'
import { completeFinale, useData } from '../core/store'
import { courseProgress } from '../core/course'
import { getUnit, unitMutun, units } from '../content/course'
import { href } from '../app/router'
import { Button, Card, EmptyState, StarBadge } from '../components'
import { isAr, t } from '../i18n'
import { Tx } from './study/i18n'
import { getLesson } from '../content'
import { SignInNudge } from '../sync/SignInNudge'
import { UnitLessons } from './path/ui'
import { dayLabel } from './path/helpers'
import { PassageRecite } from './study/Recorder'
import { useStudyAudio } from './study/verse'

export default function Unit({ params }: ScreenProps) {
  const u = getUnit(params.unitId)
  const d = useData()
  const audio = useStudyAudio()
  const [justDone, setJustDone] = useState<string | null>(null) // unit id whose finale was just recited here
  useEffect(() => { if (params.finale) document.getElementById('finale')?.scrollIntoView() }, [params.finale])
  if (!u) return <EmptyState title={t("This unit isn't in the course.")} action={<Button href={href('plan')}>{t('Course map')}</Button>} />
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
          <p className="muted">{isAr ? t('Unit {n}', { n: u.n }) : <>Unit {u.n} · {u.nameEn}</>}</p>
        </div>
      </header>
      <p><Tx>{u.intro}</Tx></p>
      {!p.open(u) && prev && <Card className="s-note"><p><Tx>{t('This unit opens after the finale of unit {n} · {name}.', { n: prev.n, name: prev.nameAr })}</Tx></p></Card>}

      {u.lessonIds.length > 0 && <Card eyebrow={t('Lessons')}><UnitLessons u={u} p={p} /></Card>}

      {u.finale && (
        <section id="finale" aria-label={t('Unit finale')}>
          <Card eyebrow={<>{t('Finale')} · <span lang="ar">{u.finale.label}</span></>}>
            {justDone === u.id ? <UnitComplete u={u} /> : <>
              {recited && <p className="t-sm">{t('Recited {day}. You can recite it again any time.', { day: dayLabel(recited.on) })}</p>}
              {p.open(u) && p.lessonsDone(u) ? (
                <PassageRecite from={u.finale.from} to={u.finale.to} audio={audio} doneLabel={t('I recited it')}
                  onDone={recited ? undefined : () => { audio.stop(); completeFinale(u.id); setJustDone(u.id); window.scrollTo(0, 0) }} />
              ) : (
                <p className="t-sm"><Tx>{t('After the last lesson of this unit, recite {x}. That opens the next unit.', { x: u.finale.label })}</Tx></p>
              )}
            </>}
            <p className="t-sm muted">{t('Self-checked against the reciter. A teacher can listen too: add it to your next session.')}</p>
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
    ? { link: href('learn', next.id), label: t('Next lesson: {x}', { x: getLesson(next.id)?.nameAr ?? '' }) }
    : next.kind === 'finale'
      ? { link: href('unit', next.unit.id), label: t('Open unit {n} · {name}', { n: next.unit.n, name: next.unit.nameAr }) }
      : { link: href('today'), label: t('Back to today') }
  return (
    <div className="s-study s-summary" role="status">
      <StarBadge n={u.n} size={52} state="done" />
      <p className="t-lg">{t('Unit {n} complete.', { n: u.n })}</p>
      <p>{next.kind === 'done' ? <Tx>{t('The course is done. تقبّل الله منك')}</Tx> : t('The next unit is open.')}</p>
      <Button block href={to.link}><Tx>{to.label}</Tx></Button>
      <SignInNudge />
    </div>
  )
}

const MATN_NAME: Record<MatnLine['matn'], string> = { tuhfa: 'تحفة الأطفال', jazariyya: 'المقدمة الجزرية' }

/** Optional: the matching lines of تحفة الأطفال / الجزرية; memorise = the first half-line shown, tap to reveal the second. */
function Mutun({ lines }: { lines: MatnLine[] }) {
  const [memorise, setMemorise] = useState(false)
  return (
    <Card eyebrow={isAr ? 'المتون (اختياري)' : <>Optional · <span lang="ar">المتون</span></>}>
      <Button variant="secondary" aria-pressed={memorise} onClick={() => setMemorise(!memorise)}>{memorise ? t('Show whole lines') : t('Memorise')}</Button>
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
            {l.gloss && !memorise && <p className="t-sm muted"><Tx>{l.gloss}</Tx></p>}
          </li>
        ))}
      </ol>
      </section>
      ))}
      {memorise && <p className="t-sm muted">{t('Say the second half from memory, then tap the line to check.')}</p>}
    </Card>
  )
}
