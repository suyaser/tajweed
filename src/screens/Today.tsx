// #/today → "Continue" (v2 spec §5): the next step in the course, review, practice, and where you are in the unit.
import { useMemo, useState } from 'react'
import { storagePersisted, suggestPassages, useData } from '../core/store'
import { buildQueue } from '../core/scheduler'
import { courseProgress } from '../core/course'
import { diffDays, today } from '../core/day'
import { getLesson } from '../content'
import { courseLesson, courseOrder, getUnit, units } from '../content/course'
import { href } from '../app/router'
import { Button, Card, CorrectionTag, Nudge, ProgressDots, Sheet, StarBadge } from '../components'
import { isAr, t } from '../i18n'
import { tn, Tx } from './study/i18n'
import { mem, rangeParam, rangeRef, setMem, teacherNear, week } from './study/helpers'
import './study.css'
import './path.css'
import { SignInNudge } from '../sync/SignInNudge'
import { useSync } from '../sync/sync'

export default function Today() {
  const data = useData()
  const { user } = useSync()
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
  // v1 learners: lessons v2 added to units they had passed (engineering M4); optional, never blocking
  const catchUp = courseOrder.filter(progress.catchUp)

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
      <section aria-label={t('Continue')} className="today-main s-study">
        {tips && (
          <Nudge action={<Button variant="ghost" href={href('guide')}>{t('How it works')}</Button>} onDismiss={() => dismiss('hint:today')}>
            {t('Start with the card below: one lesson at a time, about 15 minutes, in seven short steps. Then do your review. ✕ hides these tips.')}
          </Nudge>
        )}

        <Card level="e2" eyebrow={isAr ? 'تابع' : <>Continue · <span lang="ar">تابع</span></>}>
          {q.sabaq && nextLesson ? (
            <>
              <p className="t-sm muted num">{t('Lesson {n} of {m} · Unit {u}', { n: courseOrder.indexOf(nextLesson.id) + 1, m: courseOrder.length, u: unit.n })}</p>
              <p className="a-h3" lang="ar">{nextLesson.nameAr}</p>
              {!isAr && <p className="muted">{nextLesson.nameEn}</p>}
              {learnedToday.length > 0 && <p className="t-sm"><Tx>{t('Learned today: {x}', { x: learnedToday.join('، ') })}</Tx></p>}
              <Button block href={href('learn', nextLesson.id)}>{resume ? t('Continue lesson') : t('Start lesson')}</Button>
            </>
          ) : q.sabaqReason === 'finale' && finaleUnit ? (
            <>
              <p className="t-sm muted">{t('Unit {n} finale', { n: finaleUnit.n })}</p>
              <p className="a-h3" lang="ar">{finaleUnit.finale?.label ?? finaleUnit.nameAr}</p>
              <p><Tx>{t('Every lesson of {u} is done. Recite {x} from start to end to open the next unit.', { u: finaleUnit.nameAr, x: finaleUnit.finale?.label ?? t('the passage') })}</Tx></p>
              <Button block href={href('unit', finaleUnit.id) + '?finale=1'}>{t('Recite the finale')}</Button>
            </>
          ) : q.sabaqReason === 'pace' ? (
            <>
              <p className="t-lg"><Tx>{t('Learned today: {x}.', { x: learnedToday.join('، ') })}</Tx></p>
              <p>
                {t('Two new lessons a day is the pace that sticks.')} {nextLesson && <Tx>{t('Tomorrow: {x}.', { x: nextLesson.nameAr })}</Tx>}{' '}
                {due > 0 ? t('Today, do your review below.') : practice.length ? t('Today, recite your recent passages below.') : t('Come back tomorrow.')}
              </p>
            </>
          ) : q.sabaqReason === 'backlog' ? (
            <>
              <p className="t-lg">{t('Review first.')}</p>
              <p>{tn('{n} reviews are due. New lessons resume when fewer than 15 are overdue.', '{n} reviews are due. New lessons resume when fewer than 15 are overdue.', dueManzil)}</p>
              <Button block href={href('review') + '?go=1'}>{t('Review')}</Button>
            </>
          ) : (
            <>
              <StarBadge size={44} state="done" />
              <p className="t-lg"><Tx>{t('The course is done. تقبّل الله منك')}</Tx></p>
              <p>{t('Keep your review going, and keep reciting to a teacher.')}</p>
            </>
          )}
        </Card>

        <Card eyebrow={isAr ? 'المراجعة' : <><span lang="ar">المراجعة</span> · Review</>}>
          {due > 0 ? (
            <>
              <p className="num"><Tx>{t('This week (سبقي) {a} · Older (منزل) {b}', { a: q.sabqi.length, b: q.manzil.length })}</Tx>{reviewedToday > 0 && t(' · {n} left', { n: due })}</p>
              {jali > 0 && (isAr
                ? <p className="t-sm">⚑ {tn('{n} correction due', '{n} corrections due', jali)} <CorrectionTag severity="jali" /></p>
                : <p className="t-sm">⚑ {jali} <CorrectionTag severity="jali" /> {jali === 1 ? 'correction' : 'corrections'} due</p>)}
              <div className="s-part-actions"><Button href={href('review') + '?go=1'}>{reviewedToday ? t('Continue review') : t('Review')}</Button></div>
            </>
          ) : (
            <p className="t-sm">{data.items.length ? t('Nothing due today.') : t('Nothing to review yet. Your first lesson starts it.')}</p>
          )}
        </Card>

        {catchUp.length > 0 && (
          <Card eyebrow={t('New in this version')}>
            <p className="t-sm">{tn("{n} new lesson in units you have finished. Take them when you like; they don't hold up the course.", "{n} new lessons in units you have finished. Take them when you like; they don't hold up the course.", catchUp.length)}</p>
            <Button variant="secondary" href={href('learn', catchUp[0])}><Tx>{t('Start {x}', { x: getLesson(catchUp[0])?.nameAr ?? '' })}</Tx></Button>
          </Card>
        )}

        {practice.length > 0 && (
          <Card eyebrow={isAr ? 'التلاوة' : <><span lang="ar">التلاوة</span> · Practice</>}>
            <p className="t-sm">{t('Recite your recent passages again: listen, recite, record, compare.')}</p>
            <ul className="s-targets">
              {practice.map(p => (
                <li key={p.id}>
                  <a href={href('listen', rangeParam(p.closing!.from, p.closing!.to))}>
                    <bdi lang="ar">{rangeRef(p.closing!.from, p.closing!.to)}</bdi>{' '}
                    <bdi lang="ar" className="t-sm muted">{getLesson(p.id)?.nameAr}</bdi> <span aria-hidden="true">›</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <aside className="today-side">
        <Card eyebrow={<>{t('Unit {n}', { n: unit.n })} · <span lang="ar">{unit.nameAr}</span></>}>
          <p className="t-sm num">
            {unit.lessonIds.length ? t('{n} of {m} lessons done', { n: unitDone, m: unit.lessonIds.length }) : t('One passage, every rule so far')}
            {unit.finale && (progress.finaleDone(unit) ? t(' · finale recited') : t(' · then the finale'))}
          </p>
          <p className="t-sm s-links"><a href={href('unit', unit.id)} aria-label={t('Open unit {n}, {name}', { n: unit.n, name: isAr ? unit.nameAr : unit.nameEn })}>{t('Open the unit ›')}</a> <a href={href('plan')}>{t('Course map ›')}</a></p>
        </Card>

        <Card eyebrow={t('This week')}>
          <ProgressDots days={w.marks} today={w.todayIndex} />
          <p className="t-sm num">
            {w.count === 0 && data.settings.onboardedOn === day ? t('Your week starts today.') : `${tn('{n} day studied this week', '{n} days studied this week', w.count)} · ${t('This month: {n}', { n: w.month })}`}
          </p>
        </Card>

        {near && (
          <Card eyebrow={isAr ? `الشيخ · ${near.when === 'today' ? t('today') : t('tomorrow')}` : <><span lang="ar">الشيخ</span> · Teacher {near.when}</>}>
            <p>
              {data.settings.teacherName ? <Tx>{t('With {x}', { x: data.settings.teacherName })}</Tx> : t('Your session')}
              {plan[0] && <> · <Tx>{t('recite {x}', { x: rangeRef(plan[0].from, plan[0].to) })}</Tx></>}
              {openCorr > 0 && ` · ${tn('{n} correction to re-check', '{n} corrections to re-check', openCorr)}`}
            </p>
            <Button variant="secondary" href={near.session ? href('teacher', near.session.id) : href('teacher', 'new')}>{near.session ? t('Open the plan') : t('Plan this session')} ›</Button>
          </Card>
        )}

        {q.welcomeBack && (
          <Card className="s-note">
            <p>
              {isAr
                ? `${t('Welcome back.')} ${tn('{n} reviews are waiting', '{n} reviews are waiting', q.welcomeBack.due)}، ${tn('about {n} day at today\'s pace', 'about {n} days at today\'s pace', q.welcomeBack.daysToCatchUp)}. ${t('New lessons resume after that.')}`
                : <>Welcome back. {q.welcomeBack.due} reviews are waiting, about {q.welcomeBack.daysToCatchUp}{' '}
              {q.welcomeBack.daysToCatchUp === 1 ? 'day' : 'days'} at today's pace. New lessons resume after that.</>}
            </p>
          </Card>
        )}
      </aside>

      <div className="today-nudges">
        <SignInNudge />
        {nudge === 'install' && (
          <Nudge
            action={<button type="button" className="btn btn-ghost" onClick={() => setHowOpen(true)}>{t('How')}</button>}
            onDismiss={() => dismiss('install')}
          >
            {t("Install to home screen so your data is kept. Safari can clear sites you haven't opened for a week.")}
          </Nudge>
        )}
        {nudge === 'backup' && !user && (
          <Nudge action={<Button variant="ghost" href={href('settings')}>{t('Back up now')}</Button>} onDismiss={() => dismiss('backup')}>
            {backupAge == null ? t('No backup yet.') : tn('Last backup: {n} days ago.', 'Last backup: {n} days ago.', backupAge)}
          </Nudge>
        )}
      </div>
      <Sheet open={howOpen} onClose={() => setHowOpen(false)} title={t('Install Tajweed Path')}>
        <ul className="s-bullets">
          <li>{t('iPhone (Safari): tap Share, then “Add to Home Screen”.')}</li>
          <li>{t('Android (Chrome): open the ⋮ menu, then “Install app”.')}</li>
          <li>{t('Laptop (Chrome or Edge): use the install icon in the address bar.')}</li>
        </ul>
      </Sheet>
    </div>
  )
}
