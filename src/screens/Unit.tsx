// #/unit/:unitId (v2 spec §5): intro, lessons, the finale (recite → completeFinale), optional mutun lines.
import { useEffect, useState } from 'react'
import type { ScreenProps } from '../app/App'
import type { MatnLine, Unit as UnitT } from '../core/types'
import { completeFinale, useData } from '../core/store'
import { courseProgress } from '../core/course'
import { getUnit, unitMutun, units } from '../content/course'
import { href } from '../app/router'
import { digits, isAr, t } from '../i18n'
import { Tx } from './study/i18n'
import { getLesson } from '../content'
import { SignInNudge } from '../sync/SignInNudge'
import { Panel, UnitLessons, UnitNode } from './path/blocks'
import { dayLabel } from './path/helpers'
import { PassageRecite } from './study/Recorder'
import { useStudyAudio } from './study/verse'
import { RECITERS } from '../quran'
import { canDownload, cachedCount, download, unitUrls } from '../audio/download'
import { Callout, EmptyState, Sep } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export default function Unit({ params }: ScreenProps) {
  const u = getUnit(params.unitId)
  const d = useData()
  const audio = useStudyAudio()
  const [justDone, setJustDone] = useState<string | null>(null) // unit id whose finale was just recited here
  useEffect(() => { if (params.finale) document.getElementById('finale')?.scrollIntoView() }, [params.finale])
  if (!u) return <EmptyState icon="map" title={t("This unit isn't in the course.")} action={<Button asChild className="no-underline"><a href={href('plan')}>{t('Course map')}</a></Button>} />
  const p = courseProgress(d, units)
  const lines = unitMutun(u)
  const recited = d.finales.find((f) => f.unitId === u.id)
  const prev = units[units.indexOf(u) - 1]

  return (
    <div className="flex flex-col gap-space-lg">
      <header className="flex items-center gap-space-md">
        <UnitNode n={u.n} size="lg" status={p.lessonsDone(u) && p.finaleDone(u) ? 'passed' : p.open(u) ? 'active' : 'locked'} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">{isAr ? t('Unit {n}', { n: u.n }) : <>Unit {u.n}<Sep />{u.nameEn}</>}</p>
          <h1 lang="ar" className="text-arabic-headline text-primary">{u.nameAr}</h1>
        </div>
      </header>
      <p className="text-body-lg text-on-surface"><Tx>{u.intro}</Tx></p>
      {!p.open(u) && prev && (
        <Callout variant="note" icon="lock"><Tx>{t('This unit opens after the finale of unit {n} · {name}.', { n: prev.n, name: prev.nameAr })}</Tx></Callout>
      )}

      {u.lessonIds.length > 0 && <Panel title={t('Lessons')} ar="الدروس" icon="menu_book"><UnitLessons u={u} p={p} /></Panel>}

      {u.finale && (
        <Panel id="finale" aria-label={t('Unit finale')} title={t('Finale')} ar={u.finale.label} icon="star"
          aside={isAr ? <span lang="ar" className="font-naskh text-body-md font-semibold text-primary">{u.finale.label}</span> : undefined}>
          {justDone === u.id ? <UnitComplete u={u} /> : <>
            {recited && <p className="flex items-center gap-1.5 text-body-md text-on-surface"><Icon name="check_circle" size={18} fill className="text-success" />{t('Recited {day}. You can recite it again any time.', { day: dayLabel(recited.on) })}</p>}
            {p.open(u) && p.lessonsDone(u) ? (
              <PassageRecite from={u.finale.from} to={u.finale.to} audio={audio} doneLabel={t('I recited it')}
                onDone={recited ? undefined : () => { audio.stop(); completeFinale(u.id); setJustDone(u.id); window.scrollTo(0, 0) }} />
            ) : (
              <p className="text-body-md text-on-surface-variant"><Tx>{t('After the last lesson of this unit, recite {x}. That opens the next unit.', { x: u.finale.label })}</Tx></p>
            )}
          </>}
          <p className="text-label text-on-surface-variant">
            {t('Self-checked against the reciter. Only a teacher can tell you how you really recite.')}{' '}
            <a href={href('resources')} className="font-semibold text-primary underline underline-offset-4">{t('Find a teacher')}</a>
          </p>
        </Panel>
      )}

      {u.lessonIds.length > 0 && <OfflineAudio u={u} />}

      {lines.length > 0 && <MutunLinks lines={lines} />}
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
    <div role="status" className="flex flex-col items-center gap-space-sm py-space-md text-center">
      <UnitNode n={u.n} size="lg" status="passed" />
      <p className="text-headline-md text-on-surface">{t('Unit {n} complete.', { n: u.n })}</p>
      <p className="text-body-md text-on-surface-variant">{next.kind === 'done' ? <Tx>{t('The course is done. تقبّل الله منك')}</Tx> : t('The next unit is open.')}</p>
      <Button asChild className="mt-space-sm w-full no-underline">
        <a href={to.link}><Tx>{to.label}</Tx><Icon name="arrow_forward" size={20} rtlFlip /></a>
      </Button>
      <Button asChild variant="secondary" className="w-full no-underline">
        <a href={href('resources')}><Icon name="school" size={20} />{t('Recite this unit to a teacher')}</a>
      </Button>
      <div className="w-full text-start"><SignInNudge /></div>
    </div>
  )
}

/** Save every ayah this unit plays for offline use (the service worker keeps it). Hidden where it can't work. */
function OfflineAudio({ u }: { u: UnitT }) {
  const { settings } = useData()
  const folder = (RECITERS.find(r => r.id === settings.reciterId) ?? RECITERS[0]).folder
  const urls = unitUrls(u, folder)
  const [have, setHave] = useState<number | null>(null)
  const [busy, setBusy] = useState<number | null>(null) // files done in the current download
  const [failed, setFailed] = useState(0)
  const ok = canDownload()
  const key = urls.join()
  useEffect(() => { if (ok) cachedCount(urls).then(setHave, () => setHave(null)) }, [key, ok]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!ok || have === null) return null
  const all = have >= urls.length
  const run = async () => {
    setBusy(0); setFailed(0)
    const f = await download(urls, setBusy)
    setFailed(f); setBusy(null); setHave(await cachedCount(urls))
  }
  return (
    <Panel title={t('Offline audio')} ar="الصوت دون إنترنت" icon={all ? 'cloud_done' : 'download'}>
      <p className="text-body-md text-on-surface-variant">
        {all ? t("This unit's recitation is saved on this device.") : t("Save this unit's recitation ({n} ayahs) to study without internet.", { n: urls.length })}
      </p>
      {busy !== null
        ? <p role="status" className="text-body-md text-on-surface">{t('Saving {n} of {m}…', { n: busy, m: urls.length })}</p>
        : !all && <Button variant="secondary" onClick={run}><Icon name="download" size={20} />{t('Download audio')}</Button>}
      {failed > 0 && busy === null && <p role="alert" className="text-body-md text-error">{t('{n} files could not be saved. Check the connection and try again.', { n: failed })}</p>}
    </Panel>
  )
}

const MATN_NAME: Record<MatnLine['matn'], string> = { tuhfa: 'تحفة الأطفال', jazariyya: 'المقدمة الجزرية' }

/** Optional: one link per matn to its lines for this unit on the Mutun screen (which reads and memorises them). */
function MutunLinks({ lines }: { lines: MatnLine[] }) {
  return (
    <Panel title={isAr ? 'المتون (اختياري)' : 'Optional'} ar="المتون" icon="history_edu">
      <ul className="-mx-space-sm flex flex-col">
        {(['tuhfa', 'jazariyya'] as const).map((m) => {
          const ns = lines.filter((l) => l.matn === m).map((l) => l.n)
          if (!ns.length) return null
          const from = Math.min(...ns), to = Math.max(...ns)
          return (
            <li key={m}>
              <a href={`${href('mutun', m)}?from=${from}&to=${to}`}
                className="flex min-h-12 items-center gap-space-sm rounded-control px-space-sm text-on-surface no-underline transition-colors hover:bg-surface-container-low">
                <span lang="ar" className="min-w-0 flex-1 text-arabic-label font-semibold">{MATN_NAME[m]} {from === to ? digits(from) : `${digits(from)}–${digits(to)}`}</span>
                <Icon name="chevron_right" size={20} rtlFlip className="text-outline" />
              </a>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
