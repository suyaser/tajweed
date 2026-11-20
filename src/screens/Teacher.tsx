import { useState } from 'react'
import { useData } from '../core/store'
import { today } from '../core/day'
import { getLesson } from '../content'
import { Actions, Button, EmptyState, Group, SegmentedControl, T } from '../components'
import { corrLabel, dayLabel, listenHref, live, nextTeacherDay, severityCounts, upcomingSession } from './path/helpers'
import { startClass } from './path/ui'
import { Hint } from './study/Hint'
import { tn } from './study/i18n'
import { Item, SeverityTag, refCls } from './library/teacher'
import { t } from '../i18n'
import { Page, PageHeader, Sep } from '@/components/kit'
import { Icon } from '@/components/ui/icon'

export default function Teacher() {
  const d = useData()
  const [filter, setFilter] = useState<'all' | 'open'>('all')
  const on = today()
  const next = upcomingSession(d.sessions, on)
  const teacherDay = nextTeacherDay(d.settings.teacherDays, on)
  const sessions = live(d.sessions).filter((s) => s !== next).sort((a, b) => (a.on < b.on ? 1 : -1))
  const open = live(d.corrections).filter((c) => c.status === 'open').sort((a, b) => (a.severity === b.severity ? (a.createdAt < b.createdAt ? 1 : -1) : a.severity === 'jali' ? -1 : 1))
  const teacher = next?.teacherName || d.settings.teacherName

  return (
    <Page width="wide">
      <PageHeader en="Teacher" ar="الشيخ" detail={[
        teacher && <bdi lang="ar">{teacher}</bdi>,
        tn('{n} session', '{n} sessions', live(d.sessions).length),
        tn('{n} open correction', '{n} open corrections', open.length),
      ]} />
      <Hint id="teacher">{t('Plan each class here, log your teacher’s corrections during it, and re-check them next time. Corrections come back in your daily review.')}</Hint>

      <section aria-labelledby="next-session" className="flex flex-col gap-space-md rounded-card border border-outline-variant bg-surface-container-lowest p-space-md shadow-card sm:p-space-lg">
        <div className="flex items-start gap-space-md">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-container text-on-primary-container"><Icon name="record_voice_over" /></span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 id="next-session" className="text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">
              {next ? t('Next session · {day}', { day: dayLabel(next.on) }) : teacherDay ? t('Next teacher day · {day}', { day: dayLabel(teacherDay) }) : t('Next session')}
            </h2>
            {next ? (
              <p className="text-body-lg">
                {teacher ? <bdi lang="ar" className="font-arabic font-semibold">{teacher}</bdi> : t('Your teacher')}<Sep />
                {next.plannedPassages.length === 1 ? t('1 passage') : t('{n} passages', { n: next.plannedPassages.length })}
              </p>
            ) : (
              <p className="text-body-md text-on-surface-variant">{t('No plan yet. The app suggests what to recite: your unit finale, open corrections and what you practised.')}</p>
            )}
          </div>
        </div>
        {next ? (
          <Actions>
            <Button onClick={() => startClass(next.id)}><Icon name="play_arrow" size={20} fill />{t('Start class')}</Button>
            <Button variant="secondary" href={`#/teacher/${next.id}`}>{t('Open plan')}</Button>
          </Actions>
        ) : (
          <Actions>
            <Button href="#/teacher/new"><Icon name="edit_calendar" size={20} />{t('Plan a session')}</Button>
            <Button variant="secondary" onClick={() => startClass()}>{t('Start class now')}</Button>
          </Actions>
        )}
      </section>

      <SegmentedControl
        label={t('Show')}
        value={filter}
        onChange={setFilter}
        className="w-full sm:w-auto sm:self-start"
        options={[{ value: 'all', label: t('All') }, { value: 'open', label: t('Open corrections {n}', { n: open.length }) }]}
      />

      {filter === 'open' ? (
        open.length ? (
          <Group en="Open corrections" ar="التصحيحات المفتوحة">
            <ul className="flex flex-col divide-y divide-outline-variant" aria-label={t('Open corrections')}>
              {open.map((c) => (
                <Item key={c.id} end={<SeverityTag severity={c.severity} />}>
                  <a href={listenHref(c.verseKey)} className={refCls} lang="ar">{corrLabel(c)}</a>
                  <span className="text-body-md text-on-surface-variant">
                    <T>{c.lessonIds.map((l) => getLesson(l)?.nameAr ?? l).join('، ') || t('No rule tagged')}</T>
                    {c.note ? <><Sep /><bdi dir="auto">{c.note}</bdi></> : null}<Sep />{t('since {day}', { day: dayLabel(c.on ?? c.createdAt.slice(0, 10)) })}
                  </span>
                </Item>
              ))}
            </ul>
          </Group>
        ) : (
          <EmptyState icon="task_alt" title={t('No open corrections.')}>{t('When your teacher corrects something, it stays here until they say it is fixed.')}</EmptyState>
        )
      ) : (
        <>
          {sessions.length ? (
            <Group en="History" ar="السجل">
              <ul className="flex flex-col divide-y divide-outline-variant" aria-label={t('Sessions')}>
                {sessions.map((s) => {
                  const n = severityCounts(d.corrections, s.id)
                  return (
                    <li key={s.id}>
                      <a className="flex min-h-16 items-center gap-space-md p-space-md text-on-surface no-underline transition-colors hover:bg-surface-container-low" href={`#/teacher/${s.id}`}>
                        <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-container text-on-surface-variant">
                          <Icon name={s.status === 'planned' ? 'pending_actions' : 'event_available'} size={22} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <b className="text-body-lg font-medium">{dayLabel(s.on)}</b>
                          <span className="text-body-md text-on-surface-variant">
                            {s.status === 'planned' ? t('Planned, not finished') : s.teacherName ? <bdi lang="ar" className="font-arabic">{s.teacherName}</bdi> : t('Session')}
                          </span>
                        </span>
                        <span className="flex flex-wrap justify-end gap-1">
                          {n.jali > 0 && <SeverityTag severity="jali" count={n.jali} />}
                          {n.khafi > 0 && <SeverityTag severity="khafi" count={n.khafi} />}
                          {!n.jali && !n.khafi && s.status === 'done' && <span className="text-label text-on-surface-variant">{t('no corrections')}</span>}
                        </span>
                        <Icon name="chevron_right" rtlFlip className="text-outline" />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </Group>
          ) : next ? null : (
            <EmptyState icon="history" title={t('No past sessions yet. They appear here after your first class.')} />
          )}
          {sessions.length > 0 && <Button variant="secondary" block href="#/teacher/new"><Icon name="add" size={20} />{t('Plan a session')}</Button>}
        </>
      )}
    </Page>
  )
}
