// #/today → "Continue" (v2 spec §5): the next step in the course, review, practice, and where you are in the unit.
import { useMemo, useState } from 'react'
import { storagePersisted, suggestPassages, useData } from '../core/store'
import { buildQueue } from '../core/scheduler'
import { courseProgress } from '../core/course'
import { diffDays, today } from '../core/day'
import { getLesson } from '../content'
import { courseLesson, courseOrder, getUnit, units } from '../content/course'
import { href } from '../app/router'
import { Button, Card, CorrectionTag, Nudge, ProgressDots, Sheet, StarBadge, T } from '../components'
import { mem, rangeParam, rangeRef, setMem, teacherNear, week } from './study/helpers'
import './study.css'
import './path.css'

export default function Today() {
  const data = useData()
  const day = today()
  const q = useMemo(() => buildQueue(data, units, day), [data, day])
  const progress = useMemo(() => courseProgress(data, units), [data])
  const [m, setM] = useState(mem)
  const remember = (p: Parameters<typeof setMem>[0]) => { setMem(p); setM(mem()) }
  const [howOpen, setHowOpen] = useState(false)
  const w = week(data, day, data.settings.onboardedOn)

  // the course
  const next = progress.next
  const nextLesson = next.kind === 'lesson' ? getLesson(next.id) : undefined
  const resume = q.sabaq && m.lesson?.id === q.sabaq && m.lesson.on === day && m.lesson.step > 0
  const learnedToday = data.introductions.filter(i => i.on === day).map(i => getLesson(i.lessonId)?.nameAr ?? '')
  const unit = next.kind === 'done' ? units[units.length - 1] : next.unit
  const unitDone = unit.lessonIds.filter(id => progress.done.has(id)).length
  const finaleUnit = q.finaleUnit ? getUnit(q.finaleUnit) : undefined

  // review
  const due = q.sabqi.length + q.manzil.length
  const dueManzil = q.manzil.length + q.overflowCount
  const jali = q.manzil.filter(i => i.kind === 'correction' && i.severity === 'jali').length
  const reviewedToday = new Set(data.attempts.filter(a => a.on === day && a.countsForSchedule && a.source !== 'teacher').map(a => a.refId)).size

  // practice: the closing passages of the last 3 lessons done (newest first)
  const practice = [...data.introductions].sort((a, b) => (a.at < b.at ? 1 : -1))
    .map(i => ({ id: i.lessonId, closing: courseLesson(i.lessonId).closing }))
    .filter((x, i, xs) => x.closing && xs.findIndex(y => y.closing?.from === x.closing!.from && y.closing?.to === x.closing!.to) === i)
    .slice(0, 3)

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
  const tips = !dismissed['hint:today']

  return (
    <div className="today">
      <section aria-label="Continue" className="today-main s-study">
        {tips && (
          <Nudge action={<Button variant="ghost" href={href('guide')}>How it works</Button>} onDismiss={() => dismiss('hint:today')}>
            Start with the card below: one lesson at a time, about 15 minutes, in seven short steps. Then do your review. ✕ hides these tips.
          </Nudge>
        )}

        <Card level="e2" eyebrow={<>Continue · <span lang="ar">تابع</span></>}>
          {q.sabaq && nextLesson ? (
            <>
              <p className="t-sm muted num">Lesson {courseOrder.indexOf(nextLesson.id) + 1} of {courseOrder.length} · Unit {unit.n}</p>
              <p className="a-h3" lang="ar">{nextLesson.nameAr}</p>
              <p className="muted">{nextLesson.nameEn}</p>
              {learnedToday.length > 0 && <p className="t-sm"><T>{`Learned today: ${learnedToday.join('، ')}`}</T></p>}
              <Button block href={href('learn', nextLesson.id)}>{resume ? 'Continue lesson' : 'Start lesson'}</Button>
            </>
          ) : q.sabaqReason === 'finale' && finaleUnit ? (
            <>
              <p className="t-sm muted">Unit {finaleUnit.n} finale</p>
              <p className="a-h3" lang="ar">{finaleUnit.finale?.label ?? finaleUnit.nameAr}</p>
              <p><T>{`Every lesson of ${finaleUnit.nameAr} is done. Recite the whole passage to open the next unit.`}</T></p>
              <Button block href={href('unit', finaleUnit.id) + '?finale=1'}>Recite the finale</Button>
            </>
          ) : q.sabaqReason === 'pace' ? (
            <>
              <p className="t-lg"><T>{`Learned today: ${learnedToday.join('، ')}.`}</T></p>
              <p>Two new lessons a day is the pace that sticks. {nextLesson && <T>{`Tomorrow: ${nextLesson.nameAr}.`}</T>} Today, review and practise.</p>
            </>
          ) : q.sabaqReason === 'backlog' ? (
            <>
              <p className="t-lg">Review first.</p>
              <p>{dueManzil} reviews are due. New lessons resume when fewer than 15 are overdue.</p>
              <Button block href={href('review')}>Review</Button>
            </>
          ) : (
            <>
              <StarBadge size={44} state="done" />
              <p className="t-lg"><T>The course is done. تقبّل الله منك</T></p>
              <p>Keep your review going, and keep reciting to a teacher.</p>
            </>
          )}
        </Card>

        <Card eyebrow={<><span lang="ar">المراجعة</span> · Review</>}>
          {due > 0 ? (
            <>
              <p className="num"><T>{`سبقي ${q.sabqi.length} · منزل ${q.manzil.length}`}</T>{reviewedToday > 0 && ` · ${due} left`}</p>
              {jali > 0 && <p className="t-sm">⚑ {jali} <CorrectionTag severity="jali" /> {jali === 1 ? 'correction' : 'corrections'} due</p>}
              <div className="s-part-actions"><Button href={href('review')}>{reviewedToday ? 'Continue review' : 'Review'}</Button></div>
            </>
          ) : (
            <p className="t-sm">{data.items.length ? 'Nothing due today.' : 'Nothing to review yet. Your first lesson starts it.'}</p>
          )}
        </Card>

        {practice.length > 0 && (
          <Card eyebrow={<><span lang="ar">التلاوة</span> · Practice</>}>
            <p className="t-sm">Recite your recent passages again: listen, recite, record, compare.</p>
            <ul className="s-targets">
              {practice.map(p => (
                <li key={p.id}>
                  <a href={href('listen', rangeParam(p.closing!.from, p.closing!.to))}>
                    <span lang="ar">{rangeRef(p.closing!.from, p.closing!.to)}</span>{' '}
                    <span className="t-sm muted"><T>{`(${getLesson(p.id)?.nameAr ?? ''})`}</T></span> <span aria-hidden="true">›</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <aside className="today-side">
        <Card eyebrow={<>Unit {unit.n} · <span lang="ar">{unit.nameAr}</span></>}>
          <p className="t-sm num">
            {unit.lessonIds.length ? `${unitDone} of ${unit.lessonIds.length} lessons done` : 'One passage, every rule so far'}
            {unit.finale && (progress.finaleDone(unit) ? ' · finale recited' : ' · then the finale')}
          </p>
          <p className="t-sm"><a href={href('unit', unit.id)}>Open the unit ›</a> · <a href={href('plan')}>Course map ›</a></p>
        </Card>

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
