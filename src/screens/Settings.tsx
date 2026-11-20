import { useEffect, useRef, useState } from 'react'
import type { Reciter, Settings as SettingsT } from '../core/types'
import type { ScreenProps } from '../app/App'
import { STORAGE_KEY, exportJson, storagePersisted, updateSettings, useData } from '../core/store'
import { today } from '../core/day'
import { makeWirdIcs } from '../core/ics'
import { RECITERS } from '../quran'
import { ayahUrl } from '../audio/urls'
import { listAll, removeAll } from '../audio/recordings'
import { Actions, Button, Confirm, Field, Group, Msg, Row, SegmentedControl, T, VerseBlock, fieldCls } from '../components'
import { WEEKDAYS, daysAgo, formatBytes } from './path/helpers'
import { download } from './path/ui'
import { supabase } from '../sync/supabase'
import { resetThisDevice, restoreBackup, useSync } from '../sync/sync'
import { syncLabel } from '../sync/SignInNudge'
import { CopyField } from '../sync/CopyField'
import { isAr, lang, setLang, t } from '../i18n'
import { cn } from '@/lib/utils'
import { Page } from '@/components/kit'
import { Icon } from '@/components/ui/icon'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const WEEK_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// Arabic day chips: short forms that fit a chip (Sunday first, like WEEKDAYS)
const AR_DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

export default function Settings({ params }: ScreenProps) {
  const { settings: s } = useData()
  const sync = useSync()
  // ?s=wird|recitation (Today's routine card): scroll to that section after the shell's scroll-to-top
  useEffect(() => {
    const id = setTimeout(() => document.getElementById(`set-${params.s}`)?.scrollIntoView({ block: 'start' }))
    return () => clearTimeout(id)
  }, [params.s])
  const set = (patch: Partial<SettingsT>) => updateSettings(patch)
  const [name, setName] = useState(s.teacherName ?? '')
  const [munfasilChanged, setMunfasilChanged] = useState(false)

  return (
    <Page width="narrow">
      {supabase && (
        <Group en="Account and backup" ar="الحساب والنسخ الاحتياطي">
          <Row icon={sync.user ? 'cloud_done' : 'cloud_off'} href="#/account"
            label={sync.user ? t('Account') : t('Sign in')}
            hint={sync.user
              ? t('{status}. Signed in as {email}.', { status: syncLabel(sync), email: sync.user.email ?? t('your account') })
              : t('Your progress is saved only on this device. Sign in to keep it safe and use it on any device.')}
          />
        </Group>
      )}

      <Group en="Language and display" ar="اللغة والعرض">
        <Row icon="translate" label={t('App language')} hint={t('The app reloads in the language you pick.')}>
          <SegmentedControl label={t('Language · اللغة')} value={lang} onChange={(v) => v !== lang && setLang(v)}
            options={[{ value: 'ar', label: <span lang="ar">العربية</span> }, { value: 'en', label: <span lang="en">English</span> }]} />
        </Row>
        <Row stack icon="format_size" label={t('Text size')} hint={t('Makes all text and buttons bigger, including the Quran text.')}>
          <div className="flex w-full flex-col gap-space-sm">
            <SegmentedControl label={t('Text size')} value={s.textSize} onChange={(v) => set({ textSize: v })} className="w-full"
              options={[{ value: 'm', label: t('Normal') }, { value: 'l', label: t('Large') }, { value: 'xl', label: t('Larger') }]} />
            <div className="rounded-control bg-surface-container-low px-space-md"><VerseBlock text="قُلْ هُوَ ٱللَّهُ أَحَدٌ" reference="الإخلاص ١" size="read" /></div>
          </div>
        </Row>
        <Row icon="contrast" label={t('Theme')}>
          <SegmentedControl label={t('Theme')} value={s.theme} onChange={(v) => set({ theme: v })}
            options={[{ value: 'light', label: t('Light') }, { value: 'dark', label: t('Dark') }, { value: 'system', label: t('System') }]} />
        </Row>
        <label className="flex cursor-pointer items-center gap-space-md p-space-md">
          <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-container text-on-surface-variant"><Icon name="texture" size={22} /></span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-body-lg font-medium">{t('Tajweed patterns')}</span>
            <span className="text-body-md text-on-surface-variant">{t('Adds a pattern under each tajweed colour, so the rule does not rely on colour alone.')}</span>
          </span>
          <Switch checked={s.tajweedPatterns} onCheckedChange={(v) => set({ tajweedPatterns: v })} />
        </label>
      </Group>

      <Group id="set-recitation" en="Recitation" ar="التلاوة">
        <Reciters value={s.reciterId} onChange={(id) => set({ reciterId: id })} />
        <Row stack icon="straighten"
          label={isAr ? 'مقدار المد المنفصل' : <><span lang="ar" className="font-arabic">المد المنفصل</span> length</>}
          hint={t('Used in explanations and in length questions. Pick the length your teacher uses and keep it.')}
        >
          <SegmentedControl label={t('Munfasil length')} value={String(s.munfasilLength) as '4' | '5'} className="w-full sm:w-auto"
            onChange={(v) => { set({ munfasilLength: +v as 4 | 5 }); setMunfasilChanged(true) }}
            options={[{ value: '4', label: t('{n} counts', { n: 4 }) }, { value: '5', label: t('{n} counts', { n: 5 }) }]} />
          {munfasilChanged && (
            <Msg className="basis-full">{t('From now on, questions expect {n} counts. Keep it the same every time; tell your teacher you changed it.', { n: s.munfasilLength })}</Msg>
          )}
        </Row>
      </Group>

      <Group id="set-wird" en="Study time and teacher" ar="الورد والشيخ">
        <Row icon="schedule" label={t('Wird time')}>
          <input type="time" className={fieldCls('w-36')} value={s.wirdTime} onChange={(e) => e.target.value && set({ wirdTime: e.target.value })} aria-label={t('Wird time')} />
        </Row>
        <Row icon="event" label={t('Add to calendar')} hint={t('A daily event at your wird time, plus your teacher day. Open the file to add it.')}>
          <Button variant="secondary" onClick={() => download('tajweed-wird.ics', makeWirdIcs(s, location.href), 'text/calendar')}>
            <Icon name="download" size={20} />{t('Download .ics')}
          </Button>
        </Row>
        <Row stack icon="calendar_month" label={t('Teacher day(s)')}>
          <div className="grid w-full grid-cols-4 gap-space-xs sm:grid-cols-7" role="group" aria-label={t('Teacher days')}>
            {[6, 0, 1, 2, 3, 4, 5].map((i) => {
              const on = s.teacherDays.includes(i)
              return (
                <button key={i} type="button" aria-label={t(WEEK_LONG[i])} aria-pressed={on}
                  onClick={() => set({ teacherDays: on ? s.teacherDays.filter((x) => x !== i) : [...s.teacherDays, i].sort() })}
                  className={cn('h-11 min-w-0 cursor-pointer rounded-control border text-label font-semibold transition-colors',
                    on ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container')}>
                  {isAr ? AR_DAYS[i] : WEEKDAYS[i].slice(0, 3)}
                </button>
              )
            })}
          </div>
        </Row>
        <Row icon="person" label={t("Teacher's name")}>
          <input
            type="text" dir="auto" lang="ar" value={name} placeholder="الشيخ…" aria-label={t("Teacher's name")} className={fieldCls('sm:w-56')}
            onChange={(e) => setName(e.target.value)} onBlur={() => set({ teacherName: name.trim() || undefined })}
          />
        </Row>
        {sync.user && <TeacherLink userId={sync.user.id} />}
        {supabase && <Row icon="groups" href="#/circle" label={t('Circles')} hint={t('Study with friends: see who studied each day this week')} />}
      </Group>

      <Group en="Your data" ar="بياناتك">
        <Data lastExportOn={s.lastExportOn} />
      </Group>

      <Group en="About" ar="عن التطبيق">
        <Row icon="library_books" href="#/resources" label={t('Credits and sources')} />
        <p className="p-space-md text-body-md text-on-surface-variant">
          <T>{t('Quran text: Tanzil (Uthmani). Tajweed markup: cpfair/quran-tajweed. Word timings: cpfair/quran-align. Recitations: everyayah.com. Everything you do is stored on this device. If you sign in, your progress (not your recordings) is also backed up to your account.')}</T>
        </p>
      </Group>

      <Reset />
    </Page>
  )
}

/** Model reciter: radio rows, each with a short sample (الإخلاص ١). */
function Reciters({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [playing, setPlaying] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  useEffect(() => () => audio.current?.pause(), [])
  const sample = (r: Reciter) => {
    audio.current?.pause()
    if (playing === r.id) return setPlaying(null)
    const a = new Audio(ayahUrl(r.folder, '112:1'))
    const end = () => setPlaying((p) => (p === r.id ? null : p))
    a.onended = end
    a.onerror = end
    a.play().catch(end)
    audio.current = a
    setPlaying(r.id)
  }
  return (
    <div className="flex flex-col gap-space-sm p-space-md">
      <span id="reciter-label" className="text-label font-semibold text-on-surface-variant">{t('Model reciter')}</span>
      <RadioGroup value={value} onValueChange={onChange} aria-labelledby="reciter-label" className="gap-space-xs">
        {RECITERS.map((r) => {
          const on = value === r.id
          return (
            <div key={r.id} className={cn('flex items-center gap-space-sm rounded-control border ps-space-md pe-space-xs transition-colors',
              on ? 'border-primary/40 bg-primary-container/50' : 'border-transparent hover:bg-surface-container-low')}>
              <RadioGroupItem id={`reciter-${r.id}`} value={r.id} />
              <label htmlFor={`reciter-${r.id}`} className="flex min-h-14 min-w-0 flex-1 cursor-pointer flex-col justify-center py-space-xs">
                <span lang="ar" className="font-arabic text-[16px] leading-snug font-medium">{r.nameAr}</span>
                {!isAr && <small className="text-caption text-on-surface-variant">{r.nameEn}</small>}
              </label>
              <button type="button" onClick={() => sample(r)} aria-label={playing === r.id ? t('Stop sample') : t('Play a sample of {name}', { name: r.nameAr })}
                className={cn('flex h-10 shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 text-label font-semibold transition-colors',
                  playing === r.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high')}>
                <Icon name={playing === r.id ? 'stop' : 'play_arrow'} size={20} fill />
                <span aria-hidden="true">{t('Sample')}</span>
              </button>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}

/** One active read-only link at a time: create, copy, turn off. */
function TeacherLink({ userId }: { userId: string }) {
  const [token, setToken] = useState<string | null | undefined>(undefined)
  const [err, setErr] = useState('')
  useEffect(() => {
    supabase!.from('share_links').select('token').eq('user_id', userId).is('revoked_at', null).order('created_at', { ascending: false }).limit(1)
      .then(({ data, error }) => { if (error) setErr(error.message); setToken(data?.[0]?.token ?? null) })
  }, [userId])
  const create = async () => {
    setErr('')
    const { data, error } = await supabase!.from('share_links').insert({ user_id: userId }).select('token').single()
    if (error) setErr(error.message)
    else setToken(data.token)
  }
  const revoke = async () => {
    setErr('')
    const { error } = await supabase!.from('share_links').update({ revoked_at: new Date().toISOString() }).eq('user_id', userId).is('revoked_at', null)
    if (error) setErr(error.message)
    else setToken(null)
  }
  return (
    <Row stack icon="link" label={t('Teacher link')}
      hint={t('A private link your teacher can open without an account. It shows your lessons, open corrections and study days for the last 30 days, read-only. Your recordings and notes are not shared.')}>
      <div className="flex w-full flex-col gap-space-sm">
        {token === undefined ? <p className="text-body-md text-on-surface-variant">{t('Loading…')}</p> : token ? (
          <>
            <CopyField text={`${location.origin}${location.pathname}#/shared/${token}`} label={t('Teacher link')} />
            <Button variant="ghost" className="self-start text-error" onClick={revoke}><Icon name="link_off" size={20} />{t('Turn off this link')}</Button>
          </>
        ) : <Button variant="secondary" className="self-start" onClick={create}><Icon name="add_link" size={20} />{t('Create a teacher link')}</Button>}
        {err && <Msg error>{err}</Msg>}
      </div>
    </Row>
  )
}

function Data({ lastExportOn }: { lastExportOn: string | null }) {
  const { user } = useSync()
  const [rec, setRec] = useState<{ n: number; bytes: number } | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(storagePersisted())
  const [pending, setPending] = useState<{ name: string; text: string; summary: string } | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)

  const refresh = () => listAll().then((rs) => setRec({ n: rs.length, bytes: rs.reduce((t, r) => t + (r.blob?.size ?? 0), 0) }), () => setRec({ n: 0, bytes: 0 }))
  useEffect(() => {
    refresh()
    navigator.storage?.persisted?.().then(setPersisted, () => {})
  }, [])

  let local = 0
  try { local = (localStorage.getItem(STORAGE_KEY)?.length ?? 0) * 2 } catch { /* blocked */ }

  const pick = async (f?: File) => {
    setMsg(null)
    if (!f) return
    const text = await f.text()
    try {
      const raw = JSON.parse(text)
      const n = (k: string) => (Array.isArray(raw?.[k]) ? raw[k].length : 0)
      setPending({ name: f.name, text, summary: t('{a} answers, {s} sessions, {c} corrections, settings', { a: n('attempts'), s: n('sessions'), c: n('corrections') }) })
    } catch {
      setMsg({ ok: false, text: t('This file is not valid JSON.') })
    }
  }
  const backup = () => download(`tajweed-path-${today()}.json`, exportJson(), 'application/json')

  return (
    <>
      <Row icon="save" label={t('Back up now')}
        hint={<>{lastExportOn ? t('Last backup: {when}.', { when: daysAgo(lastExportOn, today()) }) : t('No backup yet.')} {t('The backup holds all your progress, sessions and settings. Recordings are not included.')}</>}>
        <Button variant="secondary" onClick={backup}><Icon name="download" size={20} />{t('Back up now')}</Button>
      </Row>

      <Row stack icon="upload_file" label={t('Restore from a backup')}>
        <label className="flex w-full flex-col gap-space-sm">
          <span className="sr-only">{t('Restore from a backup')}</span>
          <input className="peer sr-only" type="file" accept="application/json,.json" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
          <span aria-hidden="true" className="inline-flex h-12 cursor-pointer items-center gap-2 self-start rounded-control border border-outline-variant px-6 text-body-md font-semibold hover:bg-surface-container peer-focus-visible:outline-[1.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-focus-visible:outline-solid">
            <Icon name="folder_open" size={20} />{t('Choose a backup file…')}
          </span>
        </label>
        {pending && (
          <Confirm label={t('Restore from this backup?')} className="w-full">
            {isAr ? (
              <p>هل تستعيد من <b><bdi>{pending.name}</bdi></b>؟ سيُستبدل كل ما على هذا الجهاز بما في النسخة: {pending.summary}. لا يمكن التراجع عن ذلك.</p>
            ) : (
              <p>Restore from <b>{pending.name}</b>? It replaces everything on this device with {pending.summary}. This can't be undone.</p>
            )}
            {user && (isAr ? (
              <p>
                أنت مسجّل الدخول، لذا <b>ستُستبدل النسخة المحفوظة في حسابك</b> أيضًا (<bdi>{user.email ?? 'حسابك'}</bdi>). وتأخذها أجهزتك الأخرى عند
                مزامنتها التالية، وتضيف إليها أي تقدّم لديها غير موجود في النسخة.
              </p>
            ) : (
              <p>
                You are signed in, so it also <b>replaces the copy in your account</b> ({user.email ?? 'your account'}). Your other devices take it
                when they next sync, and add back any progress they hold that the backup does not have.
              </p>
            ))}
            <Actions>
              <Button variant="secondary" onClick={backup}>{t('Back up current data first')}</Button>
              <Button variant="danger" onClick={() => {
                try {
                  restoreBackup(pending.text)
                  setMsg({ ok: true, text: user ? t('Restored. This device and your account now hold the backup.') : t('Restored. Everything on this device now comes from the backup.') })
                } catch (e) {
                  setMsg({ ok: false, text: t('Not restored: {reason} Nothing was changed.', { reason: (e as Error).message }) })
                }
                setPending(null)
              }}>{t('Replace')}</Button>
              <Button variant="ghost" onClick={() => setPending(null)}>{t('Cancel')}</Button>
            </Actions>
          </Confirm>
        )}
        {msg && <Msg error={!msg.ok} className="w-full">{msg.text}</Msg>}
      </Row>

      <Row stack icon="storage" label={t('Storage')}
        hint={<>
          {t('Storage used: progress {size}', { size: formatBytes(local) })}
          {rec && (rec.n ? t(', recordings {size} ({n})', { size: formatBytes(rec.bytes), n: rec.n }) : t(', no recordings saved'))}.{' '}
          {persisted === true
            ? t('The browser has agreed to keep this data.')
            : persisted === false
              ? t('The browser may clear this data if the app is not used for a while; install it to your home screen and back up often.')
              : ''}
        </>}>
        {rec && rec.n > 0 && (confirmDel ? (
          <Actions>
            <Button variant="danger" onClick={() => removeAll().then(refresh, refresh).finally(() => setConfirmDel(false))}>{t('Delete {n} recordings', { n: rec.n })}</Button>
            <Button variant="ghost" onClick={() => setConfirmDel(false)}>{t('Cancel')}</Button>
          </Actions>
        ) : (
          <Button variant="ghost" className="text-error" onClick={() => setConfirmDel(true)}><Icon name="delete" size={20} />{t('Delete all recordings')}</Button>
        ))}
      </Row>
    </>
  )
}

/** The confirm word: "reset", or its Arabic in the Arabic UI. */
const RESET_WORDS = ['reset', t('reset')]

function Reset() {
  const { user } = useSync()
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const ok = RESET_WORDS.includes(word.trim().toLowerCase())
  return (
    <section aria-label={t('Reset everything')} className="flex flex-col gap-space-sm rounded-card border border-error/30 bg-error-container/30 p-space-md">
      <div className="flex flex-wrap items-center gap-space-md">
        <span className="grid size-10 shrink-0 place-items-center rounded-control bg-error-container text-on-error-container"><Icon name="restart_alt" size={22} /></span>
        <div className="flex min-w-0 flex-1 basis-48 flex-col">
          <span className="text-body-lg font-semibold text-error">{t('Reset everything')}</span>
          <span className="text-body-md text-on-surface-variant">{t('This deletes all your progress, sessions and recordings on this device.')}</span>
        </div>
        {!open && <Button variant="danger" onClick={() => setOpen(true)}>{t('Reset everything')}</Button>}
      </div>
      {open && (
        <form className="flex flex-col gap-space-sm" onSubmit={async (e) => {
          e.preventDefault()
          if (!ok) return
          await removeAll().catch(() => {})
          await resetThisDevice()
        }}>
          <Field label={<>
            {user && t('You are signed in: this device signs out first, so the copy in your account is kept as it is (to delete that too, use Delete my account on the Account page).') + ' '}
            {t('Type')} <b>{t('reset')}</b> {t('to confirm.')}
          </>}>
            <input type="text" className={fieldCls()} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} />
          </Field>
          <Actions>
            <Button type="submit" variant="danger" disabled={!ok}>{t('Delete everything')}</Button>
            <Button variant="ghost" onClick={() => { setOpen(false); setWord('') }}>{t('Cancel')}</Button>
          </Actions>
        </form>
      )}
    </section>
  )
}
