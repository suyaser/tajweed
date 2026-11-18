import { useEffect, useState, type ReactNode } from 'react'
import type { Settings as SettingsT } from '../core/types'
import { STORAGE_KEY, exportJson, getLoadError, importJson, resetAll, storagePersisted, updateSettings, useData } from '../core/store'
import { today } from '../core/day'
import { makeWirdIcs } from '../core/ics'
import { RECITERS } from '../quran'
import { listAll, removeAll } from '../audio/recordings'
import { Button, Card, OrnHeading, SegmentedControl, VerseBlock } from '../components'
import { WEEKDAYS, daysAgo, formatBytes } from './path/helpers'
import { download } from './path/ui'
import './path.css'

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
  const loadError = getLoadError()

  return (
    <div className="p-stack">
      {loadError && (
        <Card level="e2" eyebrow="Your saved data could not be read">
          <p>{loadError.message} Nothing has been changed. Download the saved data before doing anything else, then restore it or ask for help.</p>
          <Button onClick={() => download(`tajweed-path-unreadable-${today()}.json`, loadError.raw, 'application/json')}>Download saved data</Button>
        </Card>
      )}

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
            {WEEKDAYS.map((w, i) => (
              <button
                key={w}
                type="button"
                className="p-day"
                aria-pressed={s.teacherDays.includes(i)}
                onClick={() => set({ teacherDays: s.teacherDays.includes(i) ? s.teacherDays.filter((x) => x !== i) : [...s.teacherDays, i].sort() })}
              >
                {w}
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
        <VerseBlock text="قُلْ هُوَ ٱللَّهُ أَحَدٌ" reference="الإخلاص · ١" size="read" />
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
          Quran text: Tanzil (Uthmani). Tajweed markup: cpfair/quran-tajweed. Word timings: cpfair/quran-align. Recitations: everyayah.com. Everything you do is stored on this device only; there is no account and no server.
        </p>
      </Card>
      <Reset />
    </div>
  )
}

function Data({ lastExportOn }: { lastExportOn: string | null }) {
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
        <input type="file" accept="application/json,.json" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      {pending && (
        <div className="p-confirm" role="alertdialog" aria-label="Restore from this backup?">
          <p>
            Restore from <b>{pending.name}</b>? It replaces everything on this device with {pending.summary}. This can't be undone.
          </p>
          <div className="p-actions">
            <Button variant="secondary" onClick={() => download(`tajweed-path-${today()}.json`, exportJson(), 'application/json')}>Back up current data first</Button>
            <Button variant="danger" onClick={() => {
              try {
                importJson(pending.text)
                setMsg({ ok: true, text: 'Restored. Everything on this device now comes from the backup.' })
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
        {rec && `, recordings ${formatBytes(rec.bytes)} (${rec.n})`}.{' '}
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
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  if (!open) return <Button variant="danger" block onClick={() => setOpen(true)}>Reset everything</Button>
  return (
    <Card level="e2" eyebrow="Reset everything">
      <form className="p-stack" onSubmit={async (e) => {
        e.preventDefault()
        if (word.trim().toLowerCase() !== 'reset') return
        await removeAll().catch(() => {})
        resetAll()
      }}>
        <label className="p-field">
          <span>This deletes all your progress, sessions and recordings on this device. Type <b>reset</b> to confirm.</span>
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
