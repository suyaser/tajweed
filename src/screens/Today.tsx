// #/today: the wird as a finite, ordered list (spec F1, design §5.2).
import { useMemo, useState, type ReactNode } from 'react'
import type { DayLog, PartMark } from '../core/types'
import { markDayPart, storagePersisted, suggestPassages, useData } from '../core/store'
import { buildQueue } from '../core/scheduler'
import { diffDays, today } from '../core/day'
import { drillFor, getLesson, lessons, phases } from '../content'
import { href } from '../app/router'
import { Button, Card, CorrectionTag, Nudge, Ornament, OrnHeading, ProgressDots, Sheet, StarBadge, T } from '../components'
import { currentPassage, mem, rangeParam, rangeRef, setMem, teacherNear, verseRef, week } from './study/helpers'
import './study.css'

type PartId = keyof DayLog['parts']

function Part({ n, id, ar, en, min, mark, done, children, action }: {
  n: number; id: PartId; ar: string; en: string; min: number; mark: PartMark; done: boolean; children?: ReactNode; action?: ReactNode
}) {
  return (
    <li className="s-part" data-done={done || undefined}>
      <StarBadge n={n} size={44} state={done ? 'done' : 'active'} />
      <div className="s-part-main">
        <p className="s-part-title">
          <span lang="ar" className="a-lg">{ar}</span> <span className="t-sm muted num">{min}′</span>
          {done && <span className="s-part-check"> ✓ <span className="sr-only">done</span></span>}
        </p>
        <p className="t-sm muted">{en}{mark === 'manual' && ' · Marked by hand'}</p>
        {children}
        <div className="s-part-actions">
          {action}
          {!done && <button type="button" className="btn btn-ghost" onClick={() => markDayPart(id, 'manual')}>Mark done</button>}
        </div>
      </div>
    </li>
  )
}

export default function Today() {
  const data = useData()
  const day = today()
  const q = useMemo(() => buildQueue(data, lessons, phases, day), [data, day])
  const [m, setM] = useState(mem)
  const remember = (p: Parameters<typeof setMem>[0]) => { setMem(p); setM(mem()) }
  const [howOpen, setHowOpen] = useState(false)

  const parts = data.days.find(d => d.id === day)?.parts ?? { listen: null, sabaq: null, recite: null, review: null }
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  const introducedToday = data.introductions.find(i => i.on === day)?.lessonId
  const lessonId = q.sabaq ?? introducedToday
  const lesson = lessonId ? getLesson(lessonId) : undefined
  const passage = currentPassage(data, phases, lesson?.examples[0]?.verseKey)
  const w = week(data, day, data.settings.onboardedOn)

  // سبق
  const skipped = m.skipSabaq === day
  const sabaqDone = !!parts.sabaq || skipped || !q.sabaq
  const resume = q.sabaq && m.lesson?.id === q.sabaq && m.lesson.on === day && m.lesson.step > 0
  const msPhase = data.phases.find(p => p.status === 'milestone')
  const dueManzil = q.manzil.length + q.overflowCount
  const activeLeft = data.phases.some(p => p.status === 'active')

  // التلاوة (learning review M2): one ayah for each lesson of the last 7 days, newest first (the سبقي, recited),
  // rotating through its examples day by day; the letter drill for مخارج / صفات lessons; then due open corrections.
  const corrDue = data.items
    .filter(i => i.kind === 'correction' && i.state === 'manzil' && i.dueOn <= day)
    .map(i => data.corrections.find(c => c.id === i.refId && c.status === 'open' && !c.deletedAt))
    .filter(c => !!c)
  const recent = data.introductions.filter(i => diffDays(day, i.on) < 7).sort((a, b) => (a.at < b.at ? 1 : -1))
  const newest = recent[0] ?? [...data.introductions].sort((a, b) => (a.at < b.at ? 1 : -1))[0]
  const targetOf = (lessonId: string, tag: ReactNode) => {
    const l = getLesson(lessonId)
    if (!l) return []
    const ex = l.examples[Math.floor(Date.parse(day) / 864e5) % Math.max(1, l.examples.length)]
    if (ex) return [{ key: ex.verseKey, label: verseRef(ex.verseKey), href: href('listen', rangeParam(ex.verseKey)), tag }]
    if (drillFor(l).length) return [{ key: `drill:${l.id}`, label: drillFor(l).slice(0, 3).join('، ') + '…', href: href('learn', l.id) + '?apply=1', tag }]
    return []
  }
  const ruleTag = (id: string) => <span className="t-sm muted"><T>{`(${getLesson(id)?.nameAr ?? ''})`}</T></span>
  const targets = [
    ...recent.flatMap(i => targetOf(i.lessonId, i.on === day ? <span className="t-sm muted">(new rule)</span> : ruleTag(i.lessonId))),
    ...corrDue.map(c => ({ key: c!.verseKey, label: verseRef(c!.verseKey), href: href('listen', rangeParam(c!.verseKey)), tag: <CorrectionTag severity={c!.severity} /> })),
  ].filter((t, i, xs) => xs.findIndex(x => x.key === t.key) === i).slice(0, 5)
  const repeatNewest = newest ? targetOf(newest.lessonId, null)[0] : undefined

  // المراجعة
  const due = q.sabqi.length + q.manzil.length
  const jali = q.manzil.filter(i => i.kind === 'correction' && i.severity === 'jali').length
  const reviewedToday = new Set(data.attempts.filter(a => a.on === day && a.countsForSchedule && a.source !== 'teacher').map(a => a.refId)).size
  const reviewDone = !!parts.review || due === 0

  const allDone = !!parts.listen && sabaqDone && !!parts.recite && reviewDone

  // teacher
  const near = teacherNear(data.settings.teacherDays, data.sessions, day)
  const openCorr = data.corrections.filter(c => !c.deletedAt && c.status === 'open').length
  const plan = near ? suggestPassages(data) : []

  // one nudge at a time: install, then backup
  const standalone = typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches
  const lastExport = data.settings.lastExportOn
  const backupAge = lastExport ? diffDays(day, lastExport) : null
  const dismissed = m.dismissed ?? {}
  const dismiss = (k: string) => remember({ dismissed: { ...dismissed, [k]: day } })
  const nudge =
    !standalone && storagePersisted() !== true && !dismissed.install ? 'install'
      : data.attempts.length > 0 && (backupAge == null || backupAge >= (standalone ? 14 : 7)) && !(dismissed.backup && diffDays(day, dismissed.backup) < 7) ? 'backup'
        : null

  const listenHref = href('listen', rangeParam(passage.from, passage.to))

  return (
    <div className="today">
      {allDone && (
        <section className="s-study s-summary" aria-label="Done for today">
          <Ornament />
          <p className="t-lg"><T>Your wird is done. تقبّل الله منك</T></p>
          {q.overflowCount > 0 && <Button variant="secondary" href={href('review') + '?more=10'}>10 more reviews</Button>}
          <a href={listenHref}>Listen again</a>
        </section>
      )}

      <aside className="today-side">
      <Card eyebrow="This week">
        <ProgressDots days={w.marks} today={w.todayIndex} />
        <p className="t-sm num">
          {w.count === 0 && data.settings.onboardedOn === day ? 'Your week starts today.' : `${w.count} ${w.count === 1 ? 'day' : 'days'} studied this week · This month: ${w.month}`}
        </p>
      </Card>

      {near && (
        <Card eyebrow={<><span lang="ar">الشيخ</span> · Teacher {near.when}</>}>
          <p>
            {data.settings.teacherName ? <T>{`With ${data.settings.teacherName}`}</T> : 'Your session'}
            {plan[0] && <> · <T>{`recite ${rangeRef(plan[0].from, plan[0].to)}`}</T></>}
            {openCorr > 0 && ` · ${openCorr} ${openCorr === 1 ? 'correction' : 'corrections'} to re-check`}
          </p>
          <Button variant="secondary" href={near.session ? href('teacher', near.session.id) : href('teacher', 'new')}>{near.session ? 'Open the plan' : 'Plan this session'} ›</Button>
        </Card>
      )}

      {q.welcomeBack && (
        <Card className="s-note">
          <p>
            Welcome back. {q.welcomeBack.due} reviews are waiting, about {q.welcomeBack.daysToCatchUp}{' '}
            {q.welcomeBack.daysToCatchUp === 1 ? 'day' : 'days'} at today's pace. New lessons resume after that.
          </p>
        </Card>
      )}

      </aside>

      <section aria-labelledby="wird-h" className="today-main">
        <div id="wird-h"><OrnHeading><span lang="ar">الورد</span> · Your wird, ~40′</OrnHeading></div>
        {allDone ? (
          <ul className="s-done-lines">
            {[['الاستماع والترديد', 'Listen and repeat'], ['السبق', 'New lesson'], ['التلاوة والتسجيل', 'Recite and record'], ['المراجعة', 'Review']].map(([ar, en]) => (
              <li key={en}>✓ <span lang="ar">{ar}</span> · <span className="muted">{en}</span></li>
            ))}
          </ul>
        ) : (
          <ol className="s-parts">
            <Part n={1} id="listen" ar="الاستماع والترديد" en="Listen and repeat" min={10} mark={parts.listen} done={!!parts.listen}
              action={<Button href={listenHref} variant={parts.listen ? 'secondary' : 'primary'}>{parts.listen ? 'Again' : 'Listen'}</Button>}>
              <p lang="ar" className="a-body">{rangeRef(passage.from, passage.to)}</p>
              {offline && <p className="t-sm muted">Audio needs a connection. Recite from your muṣḥaf and tick it by hand.</p>}
            </Part>

            <Part n={2} id="sabaq" ar="السبق" en="New lesson" min={10} mark={parts.sabaq} done={!!parts.sabaq}
              action={!parts.sabaq && !skipped && q.sabaq ? (
                <>
                  <Button href={href('learn', q.sabaq)}>{resume ? 'Continue lesson' : 'Start lesson'}</Button>
                  <button type="button" className="btn btn-ghost" onClick={() => remember({ skipSabaq: day })}>Not today</button>
                </>
              ) : undefined}>
              {parts.sabaq && introducedToday ? (
                <p className="t-sm"><T>{`Learned today: ${getLesson(introducedToday)?.nameAr ?? ''}`}</T></p>
              ) : skipped && q.sabaq ? (
                <p className="t-sm">Skipped today. No problem. <button type="button" className="s-linkbtn" onClick={() => remember({ skipSabaq: undefined })}>Undo</button></p>
              ) : q.sabaq ? (
                <>
                  {q.sabaqCorrected && <p className="eyebrow">Your teacher corrected this. Learn it today.</p>}
                  <p lang="ar" className="a-body">{lesson?.nameAr}</p>
                </>
              ) : (
                <SabaqReason reason={q.sabaqReason} newest={repeatNewest && newest && { name: getLesson(newest.lessonId)?.nameAr ?? '', href: repeatNewest.href }} backlog={dueManzil} activeLeft={activeLeft} passage={rangeRef(passage.from, passage.to)} listenHref={listenHref}
                  stale={!!msPhase?.milestoneOn && diffDays(day, msPhase.milestoneOn) >= 14} />
              )}
            </Part>

            <Part n={3} id="recite" ar="التلاوة والتسجيل" en="Recite and record" min={15} mark={parts.recite} done={!!parts.recite}
              action={targets.length ? undefined : <Button href={listenHref} variant={parts.recite ? 'secondary' : 'primary'}>Recite</Button>}>
              {targets.length ? (
                <ul className="s-targets">
                  {targets.map(t => (
                    <li key={t.key}><a href={t.href}><span lang="ar">{t.label}</span> {t.tag} <span aria-hidden="true">›</span></a></li>
                  ))}
                </ul>
              ) : (
                <p lang="ar" className="a-body">{rangeRef(passage.from, passage.to)}</p>
              )}
              {offline && <p className="t-sm muted">You can still record; the reciter won't play.</p>}
            </Part>

            <Part n={4} id="review" ar="المراجعة" en="Review" min={5} mark={parts.review} done={!!parts.review}
              action={due > 0 ? <Button href={href('review')}>{reviewedToday ? 'Continue' : 'Review'}</Button> : undefined}>
              {due > 0 ? (
                <>
                  <p className="t-sm num"><T>{`سبقي ${q.sabqi.length} · منزل ${q.manzil.length}`}</T>{reviewedToday > 0 && ` · ${due} left`}</p>
                  {jali > 0 && <p className="t-sm">⚑ {jali} <CorrectionTag severity="jali" /> {jali === 1 ? 'correction' : 'corrections'} due</p>}
                </>
              ) : (
                <p className="t-sm">{data.items.length ? 'Nothing due today.' : 'Nothing to review yet. Your first lesson starts it.'}</p>
              )}
            </Part>
          </ol>
        )}
        {!allDone && due > 0 && !parts.review && (
          <p className="t-sm s-center"><a href={href('review')}>Only 10 minutes? Do the review.</a></p>
        )}
      </section>

      <div className="today-nudges">
      {nudge === 'install' && (
        <Nudge
          action={<button type="button" className="btn btn-ghost" onClick={() => setHowOpen(true)}>How</button>}
          onDismiss={() => dismiss('install')}
        >
          Install to home screen so your data is kept. Safari can clear sites you haven't opened for a week.
        </Nudge>
      )}
      {nudge === 'backup' && (
        <Nudge action={<Button variant="ghost" href={href('settings')}>Back up now</Button>} onDismiss={() => dismiss('backup')}>
          {backupAge == null ? 'No backup yet.' : `Last backup: ${backupAge} days ago.`}
        </Nudge>
      )}
      </div>
      <Sheet open={howOpen} onClose={() => setHowOpen(false)} title="Install Tajweed Path">
        <ul className="s-bullets">
          <li>iPhone (Safari): tap Share, then “Add to Home Screen”.</li>
          <li>Android (Chrome): open the ⋮ menu, then “Install app”.</li>
          <li>Laptop (Chrome or Edge): use the install icon in the address bar.</li>
        </ul>
      </Sheet>
    </div>
  )
}

function SabaqReason({ reason, newest, backlog, activeLeft, passage, listenHref, stale }: {
  reason?: string; newest?: { name: string; href: string }; backlog: number; activeLeft: boolean; passage: string; listenHref: string; stale: boolean
}) {
  if (reason === 'introduced-today') return <p className="t-sm">Already learned one today. One a day keeps it sticking.</p>
  // decision 12: at most 4 new lessons a week; the free سبق slot repeats the newest rule aloud (learning review M4)
  if (reason === 'pace')
    return (
      <>
        <p className="t-sm">Four new rules this week. Today, repeat your newest rule aloud{newest ? <>: <T>{newest.name}</T></> : null}.</p>
        {newest && <Button variant="secondary" href={newest.href}>Repeat it aloud</Button>}
      </>
    )
  if (reason === 'backlog') return <p className="t-sm">Review backlog first: {backlog} due. New lessons resume when it's under 15.</p>
  if (reason === 'milestone')
    return (
      <>
        <p className="t-sm">
          {activeLeft ? 'Phase complete. Prepare the milestone.' : <T>{`Phase milestone pending: recite ${passage} to your teacher.`}</T>}
        </p>
        <Button variant="secondary" href={listenHref}>Practise the milestone</Button>
        {stale && <p className="t-sm"><a href={href('plan')}>Teacher away? Continue without the milestone ›</a></p>}
      </>
    )
  return <p className="t-sm">No phase is active yet. <a href={href('plan')}>Open your plan ›</a></p>
}
