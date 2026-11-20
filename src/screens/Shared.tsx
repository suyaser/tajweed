// Read-only teacher view of a learner's progress (#/shared/:token). No account, no onboarding, no nav.
import { useEffect, useState } from 'react'
import { EmptyState, Group, Skeleton } from '../components'
import { Chip, Page, PageHeader, Sep } from '@/components/kit'
import { Icon } from '@/components/ui/icon'
import { getLesson } from '../content'
import course from '../../content/course.json'
import { getSupabase, hasBackend } from '../sync/supabase'
import { digits, isAr, locale, SEP, t } from '../i18n'

interface Summary {
  teacherName: string | null
  lessons: { lessonId: string; on: string; step: number | null; state: string | null }[]
  finales: { unitId: string; on: string }[]
  corrections: { verseKey: string; word: string | null; note: string | null; severity: string | null; on: string | null }[]
  days: string[]
}

const units = new Map((course as { units: { id: string; n: number; nameEn: string; nameAr: string }[] }).units.map((u) => [u.id, u]))
const fmt = (d: string) => {
  try { return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')) } catch { return d }
}

export default function Shared({ params }: { params: Record<string, string> }) {
  const [data, setData] = useState<Summary | null | undefined>(undefined)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!hasBackend) { setErr(t('This version of the app cannot open shared progress.')); return }
    if (!/^[0-9a-f-]{36}$/i.test(params.token ?? '')) { setData(null); return }
    getSupabase().then((sb) => sb!.rpc('shared_progress', { p_token: params.token })).then(
      ({ data, error }) => (error ? setErr(error.message) : setData((data as Summary | null) ?? null)),
      (e) => setErr((e as Error).message),
    )
  }, [params.token])

  const brand = <PageHeader en="Shared progress" ar="التقدّم المشارَك" eyebrow={<span lang="ar">مسار التجويد</span>} />
  if (err) return <Page>{brand}<EmptyState icon="cloud_off" title={t('Could not load this progress: {reason}. Check your connection and try again.', { reason: err })} /></Page>
  if (data === undefined) return <Page>{brand}<Skeleton lines={6} label={t('Loading progress…')} /></Page>
  if (data === null) return <Page>{brand}<EmptyState icon="link_off" title={t('This link is not valid any more. The learner may have turned it off; ask them for a new one.')} /></Page>

  const item = 'flex items-start justify-between gap-space-md px-space-md py-space-sm'
  return (
    <Page>
      <PageHeader en="Shared progress" ar="التقدّم المشارَك" eyebrow={<span lang="ar">مسار التجويد</span>} />
      <p className="text-center text-body-md text-on-surface-variant lg:text-start">
        {t('A read-only summary a learner shared')}{data.teacherName ? <> {t('with')} <bdi>{data.teacherName}</bdi></> : null}{t('. It shows lessons, open corrections and study days; nothing here can be changed.')}
      </p>

      <Group en="Study days" ar="أيام الدراسة">
        <div className="flex flex-col gap-space-sm p-space-md">
          <p className="text-body-lg font-medium">{t('Studied {n} of the last 30 days', { n: data.days.length })}</p>
          {data.days.length
            ? <ul className="flex flex-wrap gap-space-xs">{data.days.slice(-14).map((d) => <li key={d}><Chip tone="primary" icon="check">{fmt(d)}</Chip></li>)}</ul>
            : <p className="text-on-surface-variant">{t('No study days in the last 30 days.')}</p>}
        </div>
      </Group>

      <Group en={t('Lessons done ({n})', { n: data.lessons.length })} ar={isAr ? undefined : 'الدروس'}>
        {data.lessons.length ? (
          <ul className="flex flex-col divide-y divide-outline-variant">
            {data.lessons.map((l) => {
              const lesson = getLesson(l.lessonId)
              return (
                <li key={l.lessonId} className={item}>
                  <span className="flex min-w-0 flex-col">
                    {lesson ? <><span lang="ar" className="text-arabic-body font-medium">{lesson.nameAr}</span>{!isAr && <small className="text-caption text-on-surface-variant">{lesson.nameEn}</small>}</> : l.lessonId}
                  </span>
                  <small className="shrink-0 text-label text-on-surface-variant">{fmt(l.on)}{l.step != null ? `${SEP}${t('level {n}', { n: l.step })}` : ''}</small>
                </li>
              )
            })}
          </ul>
        ) : <p className="p-space-md text-on-surface-variant">{t('No lessons yet.')}</p>}
      </Group>

      {data.finales.length > 0 && (
        <Group en={t('Unit finales recited')} ar={isAr ? undefined : 'خواتيم الوحدات'}>
          <ul className="flex flex-col divide-y divide-outline-variant">
            {data.finales.map((f) => {
              const u = units.get(f.unitId)
              return (
                <li key={f.unitId} className={item}>
                  <span className="flex items-center gap-space-sm"><Icon name="star" size={18} fill className="text-gold" />{u ? (isAr ? t('Unit {n}: {name}', { n: u.n, name: u.nameAr }) : `Unit ${u.n}: ${u.nameEn}`) : f.unitId}</span>
                  <small className="shrink-0 text-label text-on-surface-variant">{fmt(f.on)}</small>
                </li>
              )
            })}
          </ul>
        </Group>
      )}

      <Group en={t('Open corrections ({n})', { n: data.corrections.length })} ar={isAr ? undefined : 'التصحيحات المفتوحة'}>
        {data.corrections.length ? (
          <ul className="flex flex-col divide-y divide-outline-variant">
            {data.corrections.map((c, i) => (
              <li key={i} className={item}>
                <span className="flex min-w-0 flex-col">
                  <span><b>{digits(c.verseKey)}</b>{c.word && <><Sep /><span lang="ar" className="font-arabic text-body-lg">{c.word}</span></>}</span>
                  {c.note && <small dir="auto" className="text-body-md text-on-surface-variant">{c.note}</small>}
                </span>
                <small className="shrink-0 text-label text-on-surface-variant">{c.severity === 'jali' ? t('clear mistake') : c.severity === 'khafi' ? t('subtle mistake') : ''}{c.on ? `${SEP}${fmt(c.on)}` : ''}</small>
              </li>
            ))}
          </ul>
        ) : <p className="p-space-md text-on-surface-variant">{t('No open corrections.')}</p>}
      </Group>
    </Page>
  )
}
