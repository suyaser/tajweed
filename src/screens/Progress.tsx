import type { ReactNode } from 'react'
import type { UserData } from '../core/types'
import { useData } from '../core/store'
import { today } from '../core/day'
import { LADDER, hasOpenCorrection, levelOf, type Level } from '../core/scheduler'
import { getLesson, lessons, topics } from '../content'
import { courseOrder, getUnit, units } from '../content/course'
import { courseProgress } from '../core/course'
import { digits, isAr, t } from '../i18n'
import { tn, Tx } from './study/i18n'
import { accuracy, dayLabel, live, studiedDays, weeks } from './path/helpers'
import { LevelChip, Panel, PathTabs, WeekDots } from './path/blocks'
import { BackupBadge } from '../sync/SignInNudge'
import { Chip } from '@/components/kit'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

export default function Progress() {
  const d = useData()
  return (
    <div className="wide flex flex-col gap-space-lg">
      <PathTabs value="progress" />
      <BackupBadge detail />
      <div className="grid items-start gap-space-lg lg:grid-cols-2">
        <Recitation d={d} />
        <Recognition d={d} />
      </div>
      <Consistency d={d} />
      <Goals d={d} />
    </div>
  )
}

const times = (n: number) => tn('{n} time', '{n} times', n)
const lapses = (n: number) => tn('{n} lapse', '{n} lapses', n)
const weeksN = (n: number) => tn('{n} week', '{n} weeks', n)

const Eyebrow = ({ children }: { children: string }) => (
  <p className="text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">{children}</p>
)
const Muted = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn('text-body-md text-on-surface-variant', className)}>{children}</p>
)

/** "Title:" then one Arabic name per line, so a wrapped Arabic island never reorders the sentence. */
function NameList({ title, items }: { title: string; items: [ar: string, detail: string][] }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-label font-semibold text-on-surface-variant">{title}</p>
      <ul className="flex flex-col">
        {items.map(([ar, detail], i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-space-sm border-b border-surface-container py-1.5 last:border-0">
            <bdi lang="ar" className="font-arabic text-body-lg text-on-surface">{ar}</bdi>
            <span className="text-label text-on-surface-variant">{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Recitation({ d }: { d: UserData }) {
  const cs = live(d.corrections)
  const sessions = live(d.sessions).filter((s) => s.status === 'done' || cs.some((c) => c.sessionId === s.id)).sort((a, b) => (a.on < b.on ? 1 : -1)).slice(0, 8)
  const open = cs.filter((c) => c.status === 'open').length
  const byRule = new Map<string, number>()
  for (const c of cs) for (const l of c.lessonIds) byRule.set(l, (byRule.get(l) ?? 0) + 1)
  const top = [...byRule].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const passed = d.finales.map((f) => ({ label: getUnit(f.unitId)?.finale?.label ?? f.unitId, on: f.on }))

  return (
    <Panel>
      <div className="flex flex-col gap-0.5">
        <Eyebrow>{t('From your teacher')}</Eyebrow>
        <h2 className="text-headline-md text-on-surface">{t('How you recite')}</h2>
      </div>
      {!cs.length && !sessions.length ? (
        <Muted>{t("Your teacher's corrections will show here after your first session.")}</Muted>
      ) : (
        <>
          {sessions.length > 0 && (
            <div className="flex flex-col gap-space-sm">
              <p className="text-label font-semibold text-on-surface-variant">{t('Corrections per session')} <span className="font-normal">{t('· newest first')}</span></p>
              <ul className="flex flex-col gap-1.5">
                {sessions.map((s) => {
                  const mine = cs.filter((c) => c.sessionId === s.id)
                  const j = mine.filter((c) => c.severity === 'jali').length
                  const k = mine.length - j
                  return (
                    <li key={s.id} className="grid min-h-8 grid-cols-[7.5em_1fr_auto] items-center gap-x-space-sm">
                      <span className="text-label text-on-surface-variant">{dayLabel(s.on)}</span>
                      <span className="flex flex-wrap gap-[3px]" aria-hidden="true">
                        {Array.from({ length: j }, (_, i) => <i key={'j' + i} className="size-3 rounded-[3px] bg-error" />)}
                        {Array.from({ length: k }, (_, i) => <i key={'k' + i} className="size-3 rounded-[3px] border-[1.5px] border-outline" />)}
                      </span>
                      <span className="text-label text-on-surface"><Tx>{`${digits(j)} جلي · ${digits(k)} خفي`}</Tx></span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          <p className="text-body-md text-on-surface">{t('Open {n} · Resolved {m}', { n: open, m: cs.length - open })}</p>
          {top.length > 0 && (
            <NameList title={t('Corrected most')} items={top.map(([id, n]) => [getLesson(id)?.nameAr ?? id, times(n)])} />
          )}
          {passed.length > 0 && (
            <NameList title={t('Unit finales recited')} items={passed.map((p) => [p.label, dayLabel(p.on)])} />
          )}
        </>
      )}
    </Panel>
  )
}

const LEVELS: Level[] = ['strong', 'known', 'learning', 'not-started']

function Recognition({ d }: { d: UserData }) {
  const on = today()
  const itemOf = new Map(d.items.filter((i) => i.kind === 'lesson').map((i) => [i.refId, i]))
  const rows = lessons.map((l) => {
    const it = itemOf.get(l.id)
    const answers = d.attempts.filter((a) => a.kind === 'lesson' && a.refId === l.id && a.countsForSchedule)
    const last5 = answers.slice(-5)
    return { l, it, level: levelOf(it, d.attempts, d.corrections, on), last5: last5.filter((a) => a.correct).length, n5: last5.length, open: hasOpenCorrection(l.id, d.corrections) }
  })
  const count = (lv: Level) => rows.filter((r) => r.level === lv).length
  const slipping = rows.filter((r) => (r.it?.lapses ?? 0) >= 2).sort((a, b) => b.it!.lapses - a.it!.lapses).slice(0, 3)
  const acc = accuracy(d.attempts, on)

  return (
    <Panel>
      <div className="flex flex-col gap-0.5">
        <Eyebrow>{t('From the quiz')}</Eyebrow>
        <h2 className="text-headline-md text-on-surface">{t('What you can recognise')}</h2>
      </div>
      {!d.introductions.length ? (
        <Muted>{t('Levels start after your first lesson.')}</Muted>
      ) : (
        <>
          <p className="flex flex-wrap gap-1.5">{LEVELS.map((lv) => <LevelChip key={lv} level={lv} detail={digits(count(lv))} />)}</p>
          {acc.total > 0 && (
            <p className="text-body-md text-on-surface">{t('In the last 30 days you answered {n} of {m} review questions correctly.', { n: acc.correct, m: acc.total })}</p>
          )}
          {slipping.length > 0 && (
            <NameList title={t('Slipping')} items={slipping.map((r) => [r.l.nameAr, lapses(r.it!.lapses)])} />
          )}
          <details className="group rounded-control border border-outline-variant">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-space-sm px-space-md text-body-md font-semibold text-primary [&::-webkit-details-marker]:hidden">
              {t('See all rules')}
              <Icon name="expand_more" size={20} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-space-md border-t border-outline-variant p-space-sm">
              {topics.map((tp) => {
                const tr = rows.filter((r) => r.l.topicId === tp.id).sort((a, b) => (b.it?.lapses ?? 0) - (a.it?.lapses ?? 0))
                if (!tr.length) return null
                return (
                  <section key={tp.id} className="flex flex-col gap-1">
                    <h3 className="px-space-sm pt-space-xs text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case"><Tx>{isAr ? tp.nameAr : `${tp.nameAr} · ${tp.nameEn}`}</Tx></h3>
                    <ul className="flex flex-col">
                      {tr.map(({ l, it, level, last5, n5, open }) => (
                        <li key={l.id}>
                          <a href={`#/rules/${l.id}`} className="flex flex-wrap items-center gap-x-space-sm gap-y-1 rounded-control px-space-sm py-space-sm text-on-surface no-underline transition-colors hover:bg-surface-container-low">
                            <span className="flex min-w-0 flex-1 basis-48 flex-col">
                              <span lang="ar" className="font-arabic text-body-lg">{l.nameAr}</span>
                              <span className="text-label text-on-surface-variant">
                                {it
                                  ? `${tn('every {n} day', 'every {n} days', LADDER[it.step])} · ${lapses(it.lapses)} · ${t('last {n}: {m} right', { n: n5, m: last5 })} · ${t('next {day}', { day: dayLabel(it.dueOn) })}`
                                  : t('not started')}
                              </span>
                            </span>
                            <span className="flex flex-wrap gap-1">
                              <LevelChip level={level} />
                              {open && <Chip tone="error" icon="flag" fill>{t('teacher correction open')}</Chip>}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          </details>
        </>
      )}
      <p className="flex items-start gap-1.5 text-label text-on-surface-variant"><Icon name="info" size={16} className="mt-px shrink-0" />{t('This shows you can name a rule. Only your teacher can tell you if you recite it.')}</p>
    </Panel>
  )
}

function Consistency({ d }: { d: UserData }) {
  const on = today()
  const w = weeks(studiedDays(d), on, 16, d.settings.onboardedOn)
  const shown = w.weeks.filter((x) => x.counted)
  const thisWeek = w.weeks[w.weeks.length - 1]
  return (
    <Panel title={t('Consistency')} icon="calendar_month">
      <p className="-mt-space-sm text-body-md text-on-surface">
        {tn('This week: {n} day studied.', 'This week: {n} days studied.', thisWeek.count)}
        {w.total > 1 && t(' Studied 5 or more days in {n} of the last {weeks}.', { n: w.full, weeks: weeksN(w.total) })}
      </p>
      <ol className="grid gap-x-space-lg gap-y-space-sm sm:grid-cols-2 lg:grid-cols-3" aria-label={t('Days studied per week, oldest first')}>
        {(shown.length ? shown : [thisWeek]).map((x) => (
          <li key={x.start} className="flex flex-wrap items-center gap-x-space-sm gap-y-1">
            <span className="w-[7.5em] text-label text-on-surface-variant">{dayLabel(x.start)}</span>
            <WeekDots days={x.marks} compact />
          </li>
        ))}
      </ol>
    </Panel>
  )
}

/** S1–S6 (spec §1.2), plain values. */
function Goals({ d }: { d: UserData }) {
  const on = today()
  const cs = live(d.corrections)
  const prog = courseProgress(d, units)
  const unitsDone = units.filter((u) => prog.lessonsDone(u) && prog.finaleDone(u)).length
  const lastMs = live(d.sessions).filter((s) => s.milestoneResults.length).sort((a, b) => (a.on < b.on ? 1 : -1))[0]
  const jaliLast = lastMs ? cs.filter((c) => c.sessionId === lastMs.id && c.severity === 'jali').length : null
  const quizzable = courseOrder.filter((id) => prog.done.has(id)).map((id) => getLesson(id)!).filter((l) => l.questionKinds.length)
  const strongEnough = quizzable.filter((l) => (d.items.find((i) => i.kind === 'lesson' && i.refId === l.id)?.step ?? 0) >= 3).length
  const acc = accuracy(d.attempts, on, 14)
  const khafi = cs.filter((c) => c.severity === 'khafi')
  const w = weeks(studiedDays(d), on, 16, d.settings.onboardedOn)
  const done = live(d.sessions).filter((s) => s.status === 'done').length
  const goals: [string, string, string][] = [
    ['S1', t('The course'), t('{n} of {m} lessons · {u} of {v} units done', { n: prog.done.size, m: courseOrder.length, u: unitsDone, v: units.length })],
    ['S2', t('Clear errors on the last finale session'), jaliLast == null ? t('No milestone session yet') : t('{n} جلي (goal: 0)', { n: jaliLast })],
    ['S3', t('Rule recognition (quiz only)'), t('{n} of {m} learned rules at a 14-day interval', { n: strongEnough, m: quizzable.length }) + (acc.total ? t(' · {p}% right in the last 2 weeks', { p: Math.round((100 * acc.correct) / acc.total) }) : '') + t(' (goal: all, and 90%)')],
    ['S4', t('Fine-detail corrections that stick'), khafi.length ? t('{n} of {m} خفي corrections resolved (goal: 80%)', { n: khafi.filter((c) => c.status === 'resolved').length, m: khafi.length }) : t('No خفي corrections yet')],
    ['S5', t('Consistency'), t('{n} of {weeks} with 5 or more study days (goal: 12 of 16)', { n: w.full, weeks: weeksN(w.total) })],
    ['S6', t('Teacher contact'), tn('{n} session logged (goal: 12)', '{n} sessions logged (goal: 12)', done)],
  ]
  return (
    <details className="group rounded-card border border-outline-variant bg-surface-container-lowest">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-space-sm px-space-md text-body-lg font-semibold text-on-surface sm:px-space-lg [&::-webkit-details-marker]:hidden">
        <Icon name="flag" size={20} className="text-primary" />
        <span className="flex-1">{t('Goals')}</span>
        <Icon name="expand_more" size={20} className="text-outline transition-transform group-open:rotate-180" />
      </summary>
      <dl className="grid gap-space-sm border-t border-outline-variant p-space-md sm:grid-cols-2 sm:p-space-lg">
        {goals.map(([id, name, value]) => (
          <div key={id} className="flex flex-col gap-0.5 rounded-control bg-surface-container-low p-space-md">
            <dt className="text-label text-on-surface-variant"><b className="text-secondary">{isAr ? digits(id.slice(1)) : id}</b> · {name}</dt>
            <dd className="text-body-md text-on-surface"><Tx>{value}</Tx></dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
