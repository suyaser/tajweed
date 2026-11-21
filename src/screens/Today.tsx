// #/today → "Continue" (v2 spec §5): the next step in the course, review, practice, and where you are in the unit.
import { useMemo, useState, type ReactNode } from 'react'
import { storagePersisted, suggestPassages, useData } from '../core/store'
import { buildQueue } from '../core/scheduler'
import { courseProgress } from '../core/course'
import { diffDays, today } from '../core/day'
import { getLesson } from '../content'
import { courseLesson, courseOrder, getUnit, units } from '../content/course'
import { href } from '../app/router'
import { isAr, SEP, t } from '../i18n'
import { tn, Tx } from './study/i18n'
import { mem, rangeParam, rangeRef, setMem, teacherNear, week } from './study/helpers'
import { SignInNudge } from '../sync/SignInNudge'
import { useSync } from '../sync/sync'
import { hasBackend } from '../sync/supabase'
import { getSteps, LESSON_MINUTES, STEP_IDS, type LessonSteps } from './study/lessonSteps'
import { ROUTINE_KEY } from './Onboarding'
import { Note, Panel, SeverityChip, WeekDots } from './path/blocks'
import { Sep } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { PageHeader } from '@/components/kit'
import { dates } from '../app/Shell'
import { digits } from '../i18n'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const readRoutine = () => { try { return localStorage.getItem(ROUTINE_KEY) === 'pending' } catch { return false } }

/** A link styled as a button (the ui Button renders a <button> unless asChild). */
function LinkButton({ to, children, variant = 'primary', className, ...rest }: {
  to: string; children: ReactNode; variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'; className?: string; 'aria-label'?: string
}) {
  return <Button asChild variant={variant} className={cn('no-underline', className)}><a href={to} {...rest}>{children}</a></Button>
}

const Fwd = () => <Icon name="arrow_forward" size={20} rtlFlip />

/** A tappable row inside a card: label, optional Arabic detail, forward chevron. */
function LinkRow({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <a href={to} className="flex min-h-12 items-center gap-space-sm rounded-control px-space-sm text-body-md text-on-surface no-underline transition-colors hover:bg-surface-container-low">
        <span className="min-w-0 flex-1">{children}</span>
        <Icon name="chevron_right" size={20} rtlFlip className="text-outline" />
      </a>
    </li>
  )
}

/** The lesson's one progress line: "Step n of 7" or, before it starts, the step count; and about how long it takes
 *  (LESSON_MINUTES, the onboarding figure). */
function StepLine({ steps }: { steps?: LessonSteps }) {
  const started = !!steps && (steps.done.length > 0 || steps.current !== 'hear')
  return (
    <p className="flex flex-wrap items-center text-body-md text-on-surface-variant">
      <span>{started ? t('Step {n} of {m}', { n: STEP_IDS.indexOf(steps.current) + 1, m: STEP_IDS.length }) : t('{n} steps', { n: STEP_IDS.length })}</span>
      <Sep /><span className="inline-flex items-center gap-1"><Icon name="schedule" size={16} />{t('About {n} min', { n: LESSON_MINUTES })}</span>
    </p>
  )
}

/** The inset panel at the heart of the Continue card. */
function Inset({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-space-sm rounded-card bg-surface-container-low p-space-md', className)}>{children}</div>
}

export default function Today() {
  const data = useData()
  const { user } = useSync()
  const day = today()
  const q = useMemo(() => buildQueue(data, units, day), [data, day])
  const progress = useMemo(() => courseProgress(data, units), [data])
  const [m, setM] = useState(mem)
  const remember = (p: Parameters<typeof setMem>[0]) => { setMem(p); setM(mem()) }
  const [howOpen, setHowOpen] = useState(false)
  const [routine, setRoutine] = useState(readRoutine)
  const w = week(data, day, data.settings.onboardedOn)

  // the course
  const next = progress.next
  const nextLesson = next.kind === 'lesson' ? getLesson(next.id) : undefined
  const steps = nextLesson ? getSteps(nextLesson.id) : undefined
  const started = !!steps && (steps.done.length > 0 || steps.current !== 'hear')
  const resume = started || (q.sabaq && m.lesson?.id === q.sabaq && m.lesson.on === day && m.lesson.step > 0)
  const hideRoutine = () => { try { localStorage.removeItem(ROUTINE_KEY) } catch { /* blocked */ } setRoutine(false) }
  const learnedToday = data.introductions.filter(i => i.on === day).map(i => getLesson(i.lessonId)?.nameAr ?? '')
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

  // one nudge at a time, under Review and practice: install, routine, sign-in (or, without accounts, backup)
  const standalone = typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches
  const lastExport = data.settings.lastExportOn
  const backupAge = lastExport ? diffDays(day, lastExport) : null
  const dismissed = m.dismissed ?? {}
  const dismiss = (k: string) => remember({ dismissed: { ...dismissed, [k]: day } })
  const nudge =
    !standalone && storagePersisted() !== true && !dismissed.install ? 'install'
      : routine && data.introductions.length > 0 ? 'routine'
        : hasBackend ? 'signin' // SignInNudge hides itself when signed in, before the first lesson, or after Later
          : data.attempts.length > 0 && (backupAge == null || backupAge >= (standalone ? 14 : 7)) && !(dismissed.backup && diffDays(day, dismissed.backup) < 7) ? 'backup'
            : null

  const d = dates()
  return (
    <>
    <PageHeader en="Today" ar="اليوم" detail={[
      digits(d.gregorian),
      d.hijri && <span lang="ar" className="text-secondary">{d.hijri}</span>,
      d.late,
    ]} />
    <div className="grid items-start gap-space-lg lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-gutter-md">
      <section aria-label={t('Continue')} className="flex min-w-0 flex-col gap-space-lg">
        <Panel as="div" className="gap-space-lg shadow-card">
          {q.sabaq && nextLesson ? (
            <>
              <div className="flex flex-col gap-space-xs">
                <p lang="ar" className="text-arabic-headline text-primary">{nextLesson.nameAr}</p>
                {!isAr && <p className="text-body-lg font-semibold text-on-surface">{nextLesson.nameEn}</p>}
                <StepLine steps={steps} />
              </div>
              <LinkButton to={href('learn', nextLesson.id)} className="w-full">{resume ? t('Continue lesson') : t('Start lesson')}<Fwd /></LinkButton>
            </>
          ) : q.sabaqReason === 'finale' && finaleUnit ? (
            <>
              <Inset>
                <p className="flex items-center gap-1.5 text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">
                  <Icon name="star" size={16} fill className="text-gold" />{t('Unit {n} finale', { n: finaleUnit.n })}
                </p>
                <p lang="ar" className="text-arabic-headline text-primary">{finaleUnit.finale?.label ?? finaleUnit.nameAr}</p>
                <p className="text-body-md text-on-surface"><Tx>{t('Every lesson of {u} is done. Recite {x} from start to end to open the next unit.', { u: finaleUnit.nameAr, x: finaleUnit.finale?.label ?? t('the passage') })}</Tx></p>
              </Inset>
              <LinkButton to={href('unit', finaleUnit.id) + '?finale=1'} className="w-full">{t('Recite the finale')}<Fwd /></LinkButton>
            </>
          ) : q.sabaqReason === 'pace' ? (
            <Inset>
              <p className="text-body-lg font-medium text-on-surface"><Tx>{t('Learned today: {x}.', { x: learnedToday.join('، ') })}</Tx></p>
              <p className="text-body-md text-on-surface-variant">
                {t('Two new lessons a day is the pace that sticks.')} {nextLesson && <Tx>{t('Tomorrow: {x}.', { x: nextLesson.nameAr })}</Tx>}{' '}
                {due > 0 ? t('Today, do your review below.') : practice.length ? t('Today, recite your recent passages below.') : t('Come back tomorrow.')}
              </p>
            </Inset>
          ) : q.sabaqReason === 'backlog' ? (
            <>
              <Inset>
                <p className="text-body-lg font-medium text-on-surface">{t('Review first.')}</p>
                <p className="text-body-md text-on-surface-variant">{tn('{n} reviews are due. New lessons resume when fewer than 15 are overdue.', '{n} reviews are due. New lessons resume when fewer than 15 are overdue.', dueManzil)}</p>
              </Inset>
              <LinkButton to={href('review') + '?go=1'} className="w-full">{t('Review')}<Fwd /></LinkButton>
            </>
          ) : (
            <Inset className="items-center text-center">
              <span className="grid size-14 place-items-center rounded-full bg-primary-fill text-on-primary"><Icon name="star" size={28} fill /></span>
              <p className="text-body-lg font-medium text-on-surface"><Tx>{t('The course is done. تقبّل الله منك')}</Tx></p>
              <p className="text-body-md text-on-surface-variant">{t('Keep your review going, and keep reciting to a teacher.')}</p>
            </Inset>
          )}
        </Panel>

        {catchUp.length > 0 && (
          <Panel title={t('New in this version')} icon="new_releases">
            <p className="-mt-space-sm text-body-md text-on-surface-variant">{tn("{n} new lesson in units you have finished. Take them when you like; they don't hold up the course.", "{n} new lessons in units you have finished. Take them when you like; they don't hold up the course.", catchUp.length)}</p>
            <LinkButton variant="secondary" to={href('learn', catchUp[0])} className="self-start"><Tx>{t('Start {x}', { x: getLesson(catchUp[0])?.nameAr ?? '' })}</Tx></LinkButton>
          </Panel>
        )}

      </section>

      <aside className="flex min-w-0 flex-col gap-space-lg">
        <Panel as="div" className="flex-row flex-wrap items-center gap-space-md">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-container-low text-primary"><Icon name="history_edu" /></span>
          <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
            <h2 className="flex flex-wrap items-baseline gap-x-space-sm">
              <span className="text-body-lg font-semibold text-on-surface">{t('Review')}</span>
              {!isAr && <span lang="ar" className="text-arabic-label text-on-surface-variant">المراجعة</span>}
            </h2>
            {due > 0 ? (
              <>
                <p className="text-body-md text-on-surface-variant">{t('{n} due', { n: due })}</p>
                {jali > 0 && (isAr
                  ? <p className="flex flex-wrap items-center gap-1.5 text-body-md text-on-surface">{tn('{n} correction due', '{n} corrections due', jali)} <SeverityChip severity="jali" /></p>
                  : <p className="flex flex-wrap items-center gap-1.5 text-body-md text-on-surface">{jali} <SeverityChip severity="jali" /> {jali === 1 ? 'correction' : 'corrections'} due</p>)}
              </>
            ) : (
              <p className="text-body-md text-on-surface-variant">{data.items.length ? t('Nothing due today.') : t('Nothing to review yet. Your first lesson starts it.')}</p>
            )}
          </div>
          {due > 0 && <LinkButton variant="secondary" to={href('review') + '?go=1'} className="max-sm:w-full">{reviewedToday ? t('Continue review') : t('Review')}</LinkButton>}
        </Panel>

        {practice.length > 0 && (
          <Panel title={isAr ? 'التلاوة' : 'Practice'} ar="التلاوة" icon="record_voice_over">
            <p className="-mt-space-sm text-body-md text-on-surface-variant">{t('Recite your recent passages again: listen, recite, record, compare.')}</p>
            <ul className="-mx-space-sm flex flex-col">
              {practice.map(p => (
                <LinkRow key={p.id} to={href('listen', rangeParam(p.closing!.from, p.closing!.to))}>
                  <span className="flex flex-wrap items-baseline gap-x-space-sm">
                    <bdi lang="ar" className="font-naskh text-body-lg font-semibold">{rangeRef(p.closing!.from, p.closing!.to)}</bdi>
                    <bdi lang="ar" className="font-arabic text-label text-on-surface-variant">{getLesson(p.id)?.nameAr}</bdi>
                  </span>
                </LinkRow>
              ))}
            </ul>
          </Panel>
        )}

        {nudge === 'routine' && (
          <Panel title={t('Set up your routine')} icon="tune">
            <p className="-mt-space-sm text-body-md text-on-surface-variant">{t('Three choices make the course yours. You can change them any time in Settings.')}</p>
            <ul className="-mx-space-sm flex flex-col">
              <LinkRow to={href('settings') + '?s=recitation'}>{t('Model reciter')}</LinkRow>
              <LinkRow to={href('settings') + '?s=wird'}>{t('Daily study time (wird)')}</LinkRow>
              <LinkRow to={href('settings') + '?s=wird'}>{t('Teacher day')}</LinkRow>
            </ul>
            <Button variant="ghost" onClick={hideRoutine} className="-ms-space-md self-start px-space-md">{t('Done, hide this')}</Button>
          </Panel>
        )}
        {nudge === 'signin' && <SignInNudge />}
        {nudge === 'install' && (
          <Note icon="install_mobile" action={<Button variant="tertiary" onClick={() => setHowOpen(true)}>{t('How')}</Button>} onDismiss={() => dismiss('install')}>
            {t("Install to home screen so your data is kept. Safari can clear sites you haven't opened for a week.")}
          </Note>
        )}
        {nudge === 'backup' && !user && (
          <Note icon="backup" action={<LinkButton variant="tertiary" to={href('settings')}>{t('Back up now')}</LinkButton>} onDismiss={() => dismiss('backup')}>
            {backupAge == null ? t('No backup yet.') : tn('Last backup: {n} days ago.', 'Last backup: {n} days ago.', backupAge)}
          </Note>
        )}

        <Panel title={t('This week')} icon="calendar_month">
          <WeekDots days={w.marks} today={w.todayIndex} />
          <p className="text-body-md text-on-surface-variant">
            {w.count === 0 && data.settings.onboardedOn === day ? t('Your week starts today.') : `${tn('{n} day studied this week', '{n} days studied this week', w.count)}${SEP}${t('This month: {n}', { n: w.month })}`}
          </p>
        </Panel>

        {near && (
          <Panel title={isAr ? `الشيخ${SEP}${near.when === 'today' ? t('today') : t('tomorrow')}` : `Teacher ${near.when}`} ar="الشيخ" icon="record_voice_over">
            <p className="-mt-space-sm text-body-md text-on-surface">
              {data.settings.teacherName ? <Tx>{t('With {x}', { x: data.settings.teacherName })}</Tx> : t('Your session')}
              {plan[0] && <><Sep /><Tx>{t('recite {x}', { x: rangeRef(plan[0].from, plan[0].to) })}</Tx></>}
              {openCorr > 0 && <><Sep />{tn('{n} correction to re-check', '{n} corrections to re-check', openCorr)}</>}
            </p>
            <LinkButton variant="secondary" to={near.session ? href('teacher', near.session.id) : href('teacher', 'new')}>
              {near.session ? t('Open the plan') : t('Plan this session')}<Fwd />
            </LinkButton>
          </Panel>
        )}

        {q.welcomeBack && (
          <Note icon="waving_hand">
            {isAr
              ? `${t('Welcome back.')} ${tn('{n} reviews are waiting', '{n} reviews are waiting', q.welcomeBack.due)}، ${tn('about {n} day at today\'s pace', 'about {n} days at today\'s pace', q.welcomeBack.daysToCatchUp)}. ${t('New lessons resume after that.')}`
              : <>Welcome back. {q.welcomeBack.due} reviews are waiting, about {q.welcomeBack.daysToCatchUp}{' '}
                {q.welcomeBack.daysToCatchUp === 1 ? 'day' : 'days'} at today's pace. New lessons resume after that.</>}
          </Note>
        )}
      </aside>

      <Sheet open={howOpen} onOpenChange={setHowOpen}>
        <SheetContent aria-describedby={undefined}>
          <SheetHeader><SheetTitle>{t('Install Tajweed Path')}</SheetTitle></SheetHeader>
          <ul className="flex list-disc flex-col gap-space-sm px-space-lg ps-10 pb-space-lg text-body-md text-on-surface">
            <li>{t('iPhone (Safari): tap Share, then “Add to Home Screen”.')}</li>
            <li>{t('Android (Chrome): open the ⋮ menu, then “Install app”.')}</li>
            <li>{t('Laptop (Chrome or Edge): use the install icon in the address bar.')}</li>
          </ul>
        </SheetContent>
      </Sheet>
    </div>
    </>
  )
}
