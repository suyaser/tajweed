import { useEffect, useState, type ReactNode } from 'react'
import type { Settings as SettingsT } from '../core/types'
import { STORAGE_KEY, exportJson, storagePersisted, updateSettings, useData } from '../core/store'
import { today } from '../core/day'
import { makeWirdIcs } from '../core/ics'
import { RECITERS } from '../quran'
import { listAll, removeAll } from '../audio/recordings'
import { Button, Card, OrnHeading, SegmentedControl, VerseBlock } from '../components'
import { WEEKDAYS, daysAgo, formatBytes } from './path/helpers'

const WEEK_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
import { download } from './path/ui'
import './path.css'
import { supabase } from '../sync/supabase'
import { resetThisDevice, restoreBackup, useSync } from '../sync/sync'
import { BackupBadge, syncLabel } from '../sync/SignInNudge'
import { CopyField } from '../sync/CopyField'

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

export default function Settings() {
  const { settings: s } = useData()
  const set = (patch: Partial<SettingsT>) => updateSettings(patch)
  const [name, setName] = useState(s.teacherName ?? '')
  const [munfasilChanged, setMunfasilChanged] = useState(false)

  return (
    <div className="p-stack">
      {supabase && <AccountSection />}

      <OrnHeading>Your wird</OrnHeading>
      <Card>
        <Row label="Wird time">
          <input type="time" value={s.wirdTime} onChange={(e) => e.target.value && set({ wirdTime: e.target.value })} aria-label="Wird time" />
        </Row>
        <Row label="Add to calendar" hint="A daily event at your wird time, plus your teacher day. Open the file to add it.">
          <Button variant="secondary" onClick={() => download('tajweed-wird.ics', makeWirdIcs(s, location.href), 'text/calendar')}>Download .ics</Button>
        </Row>
        <Row label="Teacher day(s)">
          <div className="p-days" role="group" aria-label="Teacher days">
            {[6, 0, 1, 2, 3, 4, 5].map((i) => [i, WEEKDAYS[i]] as const).map(([i, w]) => (
              <button
                key={w}
                type="button"
                className="s-daychip"
                aria-label={WEEK_LONG[i]}
                aria-pressed={s.teacherDays.includes(i)}
                onClick={() => set({ teacherDays: s.teacherDays.includes(i) ? s.teacherDays.filter((x) => x !== i) : [...s.teacherDays, i].sort() })}
              >
                {w.slice(0, 2)}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Teacher's name">
          <input
            type="text" dir="auto" lang="ar" value={name} placeholder="الشيخ…" aria-label="Teacher's name"
            onChange={(e) => setName(e.target.value)} onBlur={() => set({ teacherName: name.trim() || undefined })}
          />
        </Row>
      </Card>

      <OrnHeading>Recitation</OrnHeading>
      <Card>
        <fieldset className="p-radios">
          <legend>Model reciter</legend>
          {RECITERS.map((r) => (
            <label key={r.id} className="p-check">
              <input type="radio" name="reciter" checked={s.reciterId === r.id} onChange={() => set({ reciterId: r.id })} />
              <span><span lang="ar" className="a-sm">{r.nameAr}</span><br /><small className="muted">{r.nameEn}</small></span>
            </label>
          ))}
        </fieldset>
        <Row
          label={<><span lang="ar" className="a-sm">المد المنفصل</span> length</>}
          hint="Used in explanations and in length questions. Pick the length your teacher uses and keep it."
        >
          <SegmentedControl
            label="Munfasil length"
            value={String(s.munfasilLength) as '4' | '5'}
            onChange={(v) => { set({ munfasilLength: +v as 4 | 5 }); setMunfasilChanged(true) }}
            options={[{ value: '4', label: '4 counts' }, { value: '5', label: '5 counts' }]}
          />
        </Row>
        {munfasilChanged && (
          <p className="t-sm" role="status">
            From now on, questions expect {s.munfasilLength} counts. Keep it the same every time; tell your teacher you changed it.
          </p>
        )}
      </Card>

      <OrnHeading>Reading</OrnHeading>
      <Card>
        <Row label="Quran text size">
          <SegmentedControl label="Quran text size" value={s.textSize} onChange={(v) => set({ textSize: v })}
            options={[{ value: 'm', label: 'M' }, { value: 'l', label: 'L' }, { value: 'xl', label: 'XL' }]} />
        </Row>
        <div className="p-preview"><VerseBlock text="قُلْ هُوَ ٱللَّهُ أَحَدٌ" reference="الإخلاص ١" size="read" /></div>
        <Row label="Theme">
          <SegmentedControl label="Theme" value={s.theme} onChange={(v) => set({ theme: v })}
            options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]} />
        </Row>
        <label className="p-check">
          <input type="checkbox" checked={s.tajweedPatterns} onChange={(e) => set({ tajweedPatterns: e.target.checked })} />
          <span>Tajweed patterns<br /><small className="muted">Adds a pattern under each tajweed colour, so the rule does not rely on colour alone.</small></span>
        </label>
      </Card>

      <OrnHeading>Your data</OrnHeading>
      <Data lastExportOn={s.lastExportOn} />

      <OrnHeading>About</OrnHeading>
      <Card>
        <a className="p-item p-item-link" href="#/resources"><span className="p-item-main">Credits and sources</span><span className="chev" aria-hidden="true">›</span></a>
        <p className="t-sm muted">
          Quran text: Tanzil (Uthmani). Tajweed markup: cpfair/quran-tajweed. Word timings: cpfair/quran-align. Recitations: everyayah.com. Everything you do is stored on this device. If you sign in, your progress (not your recordings) is also backed up to your account.
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
      <OrnHeading>Account and backup</OrnHeading>
      <Card>
        <BackupBadge />
        <p className="t-sm">{sync.user ? `${syncLabel(sync)}. Signed in as ${sync.user.email ?? 'your account'}.` : 'Your progress is saved only on this device. Sign in to keep it safe and use it on any device.'}</p>
        <a className="p-item p-item-link" href="#/account"><span className="p-item-main">{sync.user ? 'Account' : 'Sign in'}</span><span className="chev" aria-hidden="true">›</span></a>
        <a className="p-item p-item-link" href="#/circle"><span className="p-item-main">Circles<small className="muted">Study with friends: see who studied each day this week</small></span><span className="chev" aria-hidden="true">›</span></a>
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
      <OrnHeading>Teacher link</OrnHeading>
      <Card>
        <p className="t-sm">
          A private link your teacher can open without an account. It shows your lessons, open corrections and study days for the last 30 days,
          read-only. Your recordings and notes are not shared.
        </p>
        {token === undefined ? <p className="muted t-sm">Loading…</p> : token ? (
          <>
            <CopyField text={`${location.origin}${location.pathname}#/shared/${token}`} label="Teacher link" />
            <Button variant="ghost" onClick={revoke}>Turn off this link</Button>
          </>
        ) : <Button variant="secondary" onClick={create}>Create a teacher link</Button>}
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
      setPending({ name: f.name, text, summary: `${n('attempts')} answers, ${n('sessions')} sessions, ${n('corrections')} corrections, settings` })
    } catch {
      setMsg({ ok: false, text: 'This file is not valid JSON.' })
    }
  }

  return (
    <Card>
      <p>{lastExportOn ? `Last backup: ${daysAgo(lastExportOn, today())}.` : 'No backup yet.'}</p>
      <Button onClick={() => download(`tajweed-path-${today()}.json`, exportJson(), 'application/json')}>Back up now</Button>
      <p className="t-sm muted">The backup holds all your progress, sessions and settings. Recordings are not included.</p>

      <label className="p-field">
        <span>Restore from a backup</span>
        <input className="sr-only p-file" type="file" accept="application/json,.json" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
        <span className="btn btn-secondary p-file-btn" aria-hidden="true">Choose a backup file…</span>
      </label>
      {pending && (
        <div className="p-confirm" role="alertdialog" aria-label="Restore from this backup?">
          <p>
            Restore from <b>{pending.name}</b>? It replaces everything on this device with {pending.summary}. This can't be undone.
          </p>
          {user && (
            <p>
              You are signed in, so it also <b>replaces the copy in your account</b> ({user.email ?? 'your account'}). Your other devices take it
              when they next sync, and add back any progress they hold that the backup does not have.
            </p>
          )}
          <div className="p-actions">
            <Button variant="secondary" onClick={() => download(`tajweed-path-${today()}.json`, exportJson(), 'application/json')}>Back up current data first</Button>
            <Button variant="danger" onClick={() => {
              try {
                restoreBackup(pending.text)
                setMsg({ ok: true, text: user ? 'Restored. This device and your account now hold the backup.' : 'Restored. Everything on this device now comes from the backup.' })
              } catch (e) {
                setMsg({ ok: false, text: `Not restored: ${(e as Error).message} Nothing was changed.` })
              }
              setPending(null)
            }}>Replace</Button>
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        </div>
      )}
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? '' : 'p-error'}>{msg.text}</p>}

      <p className="t-sm">
        Storage used: progress {formatBytes(local)}
        {rec && (rec.n ? `, recordings ${formatBytes(rec.bytes)} (${rec.n})` : ', no recordings saved')}.{' '}
        {persisted === true
          ? 'The browser has agreed to keep this data.'
          : persisted === false
            ? 'The browser may clear this data if the app is not used for a while; install it to your home screen and back up often.'
            : ''}
      </p>
      {rec && rec.n > 0 && (confirmDel ? (
        <div className="p-actions">
          <Button variant="danger" onClick={() => removeAll().then(refresh, refresh).finally(() => setConfirmDel(false))}>Delete {rec.n} recordings</Button>
          <Button variant="ghost" onClick={() => setConfirmDel(false)}>Cancel</Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirmDel(true)}>Delete all recordings</Button>
      ))}
    </Card>
  )
}

function Reset() {
  const { user } = useSync()
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  if (!open) return <Button variant="danger" block onClick={() => setOpen(true)}>Reset everything</Button>
  return (
    <Card level="e2" eyebrow="Reset everything">
      <form className="p-stack" onSubmit={async (e) => {
        e.preventDefault()
        if (word.trim().toLowerCase() !== 'reset') return
        await removeAll().catch(() => {})
        await resetThisDevice()
      }}>
        <label className="p-field">
          <span>
            This deletes all your progress, sessions and recordings on this device.
            {user && ' You are signed in: this device signs out first, so the copy in your account is kept as it is (to delete that too, use Delete my account on the Account page).'}
            {' '}Type <b>reset</b> to confirm.
          </span>
          <input type="text" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} />
        </label>
        <div className="p-actions">
          <Button type="submit" variant="danger" disabled={word.trim().toLowerCase() !== 'reset'}>Delete everything</Button>
          <Button variant="ghost" onClick={() => { setOpen(false); setWord('') }}>Cancel</Button>
        </div>
      </form>
    </Card>
  )
}
