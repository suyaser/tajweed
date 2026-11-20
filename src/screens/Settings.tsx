import { useEffect, useState, type ReactNode } from 'react'
import type { Settings as SettingsT } from '../core/types'
import type { ScreenProps } from '../app/App'
import { STORAGE_KEY, exportJson, storagePersisted, updateSettings, useData } from '../core/store'
import { today } from '../core/day'
import { makeWirdIcs } from '../core/ics'
import { RECITERS } from '../quran'
import { listAll, removeAll } from '../audio/recordings'
import { Button, Card, OrnHeading, SegmentedControl, T, VerseBlock } from '../components'
import { WEEKDAYS, daysAgo, formatBytes } from './path/helpers'

const WEEK_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// Arabic day chips: short forms that fit a chip (Sunday first, like WEEKDAYS)
const AR_DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
import { download } from './path/ui'
import { supabase } from '../sync/supabase'
import { resetThisDevice, restoreBackup, useSync } from '../sync/sync'
import { BackupBadge, syncLabel } from '../sync/SignInNudge'
import { CopyField } from '../sync/CopyField'
import { isAr, lang, setLang, t, FWD } from '../i18n'

function Row({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="p-set">
      <div className="p-set-label">
        <span>{label}</span>
        {hint && <small className="muted">{hint}</small>}
      </div>
      <div className="p-set-ctl">{children}</div>
    </div>
  )
}

export default function Settings({ params }: ScreenProps) {
  const { settings: s } = useData()
  // ?s=wird|recitation (Today's routine card): scroll to that section after the shell's scroll-to-top
  useEffect(() => {
    const id = setTimeout(() => document.getElementById(`set-${params.s}`)?.scrollIntoView({ block: 'start' }))
    return () => clearTimeout(id)
  }, [params.s])
  const set = (patch: Partial<SettingsT>) => updateSettings(patch)
  const [name, setName] = useState(s.teacherName ?? '')
  const [munfasilChanged, setMunfasilChanged] = useState(false)

  return (
    <div className="p-stack">
      {supabase && <AccountSection />}

      <OrnHeading>{t('Language · اللغة')}</OrnHeading>
      <Card>
        <Row label={t('App language')} hint={t('The app reloads in the language you pick.')}>
          <SegmentedControl label={t('Language · اللغة')} value={lang} onChange={(v) => v !== lang && setLang(v)}
            options={[{ value: 'en', label: <span lang="en">English</span> }, { value: 'ar', label: <span lang="ar">العربية</span> }]} />
        </Row>
      </Card>

      <div id="set-wird" className="p-anchor"><OrnHeading>{t('Your wird')}</OrnHeading></div>
      <Card>
        <Row label={t('Wird time')}>
          <input type="time" value={s.wirdTime} onChange={(e) => e.target.value && set({ wirdTime: e.target.value })} aria-label={t('Wird time')} />
        </Row>
        <Row label={t('Add to calendar')} hint={t('A daily event at your wird time, plus your teacher day. Open the file to add it.')}>
          <Button variant="secondary" onClick={() => download('tajweed-wird.ics', makeWirdIcs(s, location.href), 'text/calendar')}>{t('Download .ics')}</Button>
        </Row>
        <Row label={t('Teacher day(s)')}>
          <div className="p-days" role="group" aria-label={t('Teacher days')}>
            {[6, 0, 1, 2, 3, 4, 5].map((i) => [i, WEEKDAYS[i]] as const).map(([i, w]) => (
              <button
                key={w}
                type="button"
                className="s-daychip"
                aria-label={t(WEEK_LONG[i])}
                aria-pressed={s.teacherDays.includes(i)}
                onClick={() => set({ teacherDays: s.teacherDays.includes(i) ? s.teacherDays.filter((x) => x !== i) : [...s.teacherDays, i].sort() })}
              >
                {isAr ? AR_DAYS[i] : w.slice(0, 2)}
              </button>
            ))}
          </div>
        </Row>
        <Row label={t("Teacher's name")}>
          <input
            type="text" dir="auto" lang="ar" value={name} placeholder="الشيخ…" aria-label={t("Teacher's name")}
            onChange={(e) => setName(e.target.value)} onBlur={() => set({ teacherName: name.trim() || undefined })}
          />
        </Row>
      </Card>

      <div id="set-recitation" className="p-anchor"><OrnHeading>{t('Recitation')}</OrnHeading></div>
      <Card>
        <fieldset className="p-radios">
          <legend>{t('Model reciter')}</legend>
          {RECITERS.map((r) => (
            <label key={r.id} className="p-check">
              <input type="radio" name="reciter" checked={s.reciterId === r.id} onChange={() => set({ reciterId: r.id })} />
              <span><span lang="ar" className="a-sm">{r.nameAr}</span>{!isAr && <><br /><small className="muted">{r.nameEn}</small></>}</span>
            </label>
          ))}
        </fieldset>
        <Row
          label={isAr ? <span className="a-sm">مقدار المد المنفصل</span> : <><span lang="ar" className="a-sm">المد المنفصل</span> length</>}
          hint={t('Used in explanations and in length questions. Pick the length your teacher uses and keep it.')}
        >
          <SegmentedControl
            label={t('Munfasil length')}
            value={String(s.munfasilLength) as '4' | '5'}
            onChange={(v) => { set({ munfasilLength: +v as 4 | 5 }); setMunfasilChanged(true) }}
            options={[{ value: '4', label: t('{n} counts', { n: 4 }) }, { value: '5', label: t('{n} counts', { n: 5 }) }]}
          />
        </Row>
        {munfasilChanged && (
          <p className="t-sm" role="status">
            {t('From now on, questions expect {n} counts. Keep it the same every time; tell your teacher you changed it.', { n: s.munfasilLength })}
          </p>
        )}
      </Card>

      <OrnHeading>{t('Reading')}</OrnHeading>
      <Card>
        <Row label={t('Text size')} hint={t('Makes all text and buttons bigger, including the Quran text.')}>
          <SegmentedControl label={t('Text size')} value={s.textSize} onChange={(v) => set({ textSize: v })}
            options={[{ value: 'm', label: t('Normal') }, { value: 'l', label: t('Large') }, { value: 'xl', label: t('Larger') }]} />
        </Row>
        <div className="p-preview"><VerseBlock text="قُلْ هُوَ ٱللَّهُ أَحَدٌ" reference="الإخلاص ١" size="read" /></div>
        <Row label={t('Theme')}>
          <SegmentedControl label={t('Theme')} value={s.theme} onChange={(v) => set({ theme: v })}
            options={[{ value: 'light', label: t('Light') }, { value: 'dark', label: t('Dark') }, { value: 'system', label: t('System') }]} />
        </Row>
        <label className="p-check">
          <input type="checkbox" checked={s.tajweedPatterns} onChange={(e) => set({ tajweedPatterns: e.target.checked })} />
          <span>{t('Tajweed patterns')}<br /><small className="muted">{t('Adds a pattern under each tajweed colour, so the rule does not rely on colour alone.')}</small></span>
        </label>
      </Card>

      <OrnHeading>{t('Your data')}</OrnHeading>
      <Data lastExportOn={s.lastExportOn} />

      <OrnHeading>{t('About')}</OrnHeading>
      <Card>
        <a className="p-item p-item-link" href="#/resources"><span className="p-item-main">{t('Credits and sources')}</span><span className="chev" aria-hidden="true">{FWD}</span></a>
        <p className="t-sm muted">
          <T>{t('Quran text: Tanzil (Uthmani). Tajweed markup: cpfair/quran-tajweed. Word timings: cpfair/quran-align. Recitations: everyayah.com. Everything you do is stored on this device. If you sign in, your progress (not your recordings) is also backed up to your account.')}</T>
        </p>
      </Card>
      <Reset />
    </div>
  )
}

function AccountSection() {
  const sync = useSync()
  return (
    <>
      <OrnHeading>{t('Account and backup')}</OrnHeading>
      <Card>
        <BackupBadge />
        <p className="t-sm">{sync.user ? t('{status}. Signed in as {email}.', { status: syncLabel(sync), email: sync.user.email ?? t('your account') }) : t('Your progress is saved only on this device. Sign in to keep it safe and use it on any device.')}</p>
        <a className="p-item p-item-link" href="#/account"><span className="p-item-main">{sync.user ? t('Account') : t('Sign in')}</span><span className="chev" aria-hidden="true">{FWD}</span></a>
        <a className="p-item p-item-link" href="#/circle"><span className="p-item-main">{t('Circles')}<small className="muted">{t('Study with friends: see who studied each day this week')}</small></span><span className="chev" aria-hidden="true">{FWD}</span></a>
      </Card>
      {sync.user && <TeacherLink userId={sync.user.id} />}
    </>
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
    <>
      <OrnHeading>{t('Teacher link')}</OrnHeading>
      <Card>
        <p className="t-sm">
          {t('A private link your teacher can open without an account. It shows your lessons, open corrections and study days for the last 30 days, read-only. Your recordings and notes are not shared.')}
        </p>
        {token === undefined ? <p className="muted t-sm">{t('Loading…')}</p> : token ? (
          <>
            <CopyField text={`${location.origin}${location.pathname}#/shared/${token}`} label={t('Teacher link')} />
            <Button variant="ghost" onClick={revoke}>{t('Turn off this link')}</Button>
          </>
        ) : <Button variant="secondary" onClick={create}>{t('Create a teacher link')}</Button>}
        {err && <p role="alert" className="p-error">{err}</p>}
      </Card>
    </>
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

  return (
    <Card>
      <p>{lastExportOn ? t('Last backup: {when}.', { when: daysAgo(lastExportOn, today()) }) : t('No backup yet.')}</p>
      <Button onClick={() => download(`tajweed-path-${today()}.json`, exportJson(), 'application/json')}>{t('Back up now')}</Button>
      <p className="t-sm muted">{t('The backup holds all your progress, sessions and settings. Recordings are not included.')}</p>

      <label className="p-field">
        <span>{t('Restore from a backup')}</span>
        <input className="sr-only p-file" type="file" accept="application/json,.json" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
        <span className="btn btn-secondary p-file-btn" aria-hidden="true">{t('Choose a backup file…')}</span>
      </label>
      {pending && (
        <div className="p-confirm" role="alertdialog" aria-label={t('Restore from this backup?')}>
          {isAr ? (
            <p>
              هل تستعيد من <b><bdi>{pending.name}</bdi></b>؟ سيُستبدل كل ما على هذا الجهاز بما في النسخة: {pending.summary}. لا يمكن التراجع عن ذلك.
            </p>
          ) : (
            <p>
              Restore from <b>{pending.name}</b>? It replaces everything on this device with {pending.summary}. This can't be undone.
            </p>
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
          <div className="p-actions">
            <Button variant="secondary" onClick={() => download(`tajweed-path-${today()}.json`, exportJson(), 'application/json')}>{t('Back up current data first')}</Button>
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
          </div>
        </div>
      )}
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? '' : 'p-error'}>{msg.text}</p>}

      <p className="t-sm">
        {t('Storage used: progress {size}', { size: formatBytes(local) })}
        {rec && (rec.n ? t(', recordings {size} ({n})', { size: formatBytes(rec.bytes), n: rec.n }) : t(', no recordings saved'))}.{' '}
        {persisted === true
          ? t('The browser has agreed to keep this data.')
          : persisted === false
            ? t('The browser may clear this data if the app is not used for a while; install it to your home screen and back up often.')
            : ''}
      </p>
      {rec && rec.n > 0 && (confirmDel ? (
        <div className="p-actions">
          <Button variant="danger" onClick={() => removeAll().then(refresh, refresh).finally(() => setConfirmDel(false))}>{t('Delete {n} recordings', { n: rec.n })}</Button>
          <Button variant="ghost" onClick={() => setConfirmDel(false)}>{t('Cancel')}</Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirmDel(true)}>{t('Delete all recordings')}</Button>
      ))}
    </Card>
  )
}

/** The confirm word: "reset", or its Arabic in the Arabic UI. */
const RESET_WORDS = ['reset', t('reset')]

function Reset() {

  const { user } = useSync()
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  if (!open) return <Button variant="danger" block onClick={() => setOpen(true)}>{t('Reset everything')}</Button>
  return (
    <Card level="e2" eyebrow={t('Reset everything')}>
      <form className="p-stack" onSubmit={async (e) => {
        e.preventDefault()
        if (!RESET_WORDS.includes(word.trim().toLowerCase())) return
        await removeAll().catch(() => {})
        await resetThisDevice()
      }}>
        <label className="p-field">
          <span>
            {t('This deletes all your progress, sessions and recordings on this device.')}
            {user && ' ' + t('You are signed in: this device signs out first, so the copy in your account is kept as it is (to delete that too, use Delete my account on the Account page).')}
            {' '}{t('Type')} <b>{t('reset')}</b> {t('to confirm.')}
          </span>
          <input type="text" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} />
        </label>
        <div className="p-actions">
          <Button type="submit" variant="danger" disabled={!RESET_WORDS.includes(word.trim().toLowerCase())}>{t('Delete everything')}</Button>
          <Button variant="ghost" onClick={() => { setOpen(false); setWord('') }}>{t('Cancel')}</Button>
        </div>
      </form>
    </Card>
  )
}
