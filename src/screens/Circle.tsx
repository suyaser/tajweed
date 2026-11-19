// Private circles (حلقة): #/circle lists, creates and joins; #/circle/:id shows who studied which day this week.
// No scores, no ranks, no public listing (spec §6).
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, EmptyState, OrnHeading, ProgressDots, Skeleton, type DayMark } from '../components'
import { navigate } from '../app/router'
import { today } from '../core/day'
import { supabase } from '../sync/supabase'
import { useSync } from '../sync/sync'
import { CopyField } from '../sync/CopyField'
import './path.css'
import '../sync/sync.css'

interface CircleRow { id: string; name: string; invite_code: string; owner: string }
const NAME_KEY = 'tajweed-path:circle-name'
const savedName = () => { try { return localStorage.getItem(NAME_KEY) ?? '' } catch { return '' } }
const saveName = (n: string) => { try { localStorage.setItem(NAME_KEY, n) } catch { /* blocked */ } }
const inviteLink = (code: string) => `${location.origin}${location.pathname}#/circle?join=${encodeURIComponent(code)}`

export default function Circle({ params }: { params: Record<string, string> }) {
  const { user } = useSync()
  if (!supabase) return <Card><p>Circles are not available in this version of the app.</p></Card>
  if (!user)
    return (
      <EmptyState title="Study together in a circle" action={<Button href="#/account">Sign in</Button>}>
        A circle is a small private group (up to 20) that sees who studied which day this week. Sign in to create or join one.
        {params.join ? ` After signing in, open the invite link again to join.` : ''}
      </EmptyState>
    )
  return params.id ? <CircleView id={params.id} userId={user.id} /> : <Circles join={params.join} />
}

function Circles({ join }: { join?: string }) {
  const [list, setList] = useState<CircleRow[] | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    supabase!.from('circles').select('id, name, invite_code, owner').order('created_at').then(({ data, error }) => {
      if (error) setErr(error.message)
      setList(data ?? [])
    })
  }, [])

  return (
    <div className="p-stack">
      {join && <JoinForm initialCode={join} />}
      <OrnHeading>Your circles</OrnHeading>
      <Card>
        {list === null ? <Skeleton lines={2} /> : list.length ? (
          <ul className="p-list">
            {list.map((c) => (
              <li key={c.id}><a className="p-item p-item-link" href={`#/circle/${c.id}`}><span className="p-item-main">{c.name}</span><span className="chev" aria-hidden="true">›</span></a></li>
            ))}
          </ul>
        ) : <p className="muted">You are not in a circle yet. Create one and invite your friends, or join with a code.</p>}
        {err && <p role="alert" className="p-error">{err}</p>}
      </Card>
      <CreateForm />
      {!join && <JoinForm />}
      <p className="t-sm muted">Members see each other's name and which days they studied this week. Nothing else: no scores, no lessons, no ranking.</p>
    </div>
  )
}

function NameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="p-field">
      <span>Your name in the circle</span>
      <input type="text" dir="auto" maxLength={40} required value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function CreateForm() {
  const [name, setName] = useState('')
  const [me, setMe] = useState(savedName)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <>
      <OrnHeading>Create a circle</OrnHeading>
      <Card>
        <form className="p-stack" onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true); setErr('')
          const { data, error } = await supabase!.rpc('create_circle', { p_name: name.trim(), p_display_name: me.trim() })
          setBusy(false)
          if (error) return setErr(error.message)
          saveName(me.trim())
          navigate(`circle/${data}`)
        }}>
          <label className="p-field">
            <span>Circle name</span>
            <input type="text" dir="auto" maxLength={60} required value={name} onChange={(e) => setName(e.target.value)} placeholder="حلقة الفجر" />
          </label>
          <NameField value={me} onChange={setMe} />
          <Button type="submit" disabled={busy || !name.trim() || !me.trim()}>Create</Button>
          {err && <p role="alert" className="p-error">{err}</p>}
        </form>
      </Card>
    </>
  )
}

function JoinForm({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode)
  const [me, setMe] = useState(savedName)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <>
      <OrnHeading>Join a circle</OrnHeading>
      <Card>
        <form className="p-stack" onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true); setErr('')
          const { data, error } = await supabase!.rpc('join_circle', { p_code: code.trim(), p_name: me.trim() })
          setBusy(false)
          if (error) return setErr(error.message)
          if (!data) return setErr('That code did not work. Check it with whoever invited you and try again.')
          saveName(me.trim())
          navigate(`circle/${data}`)
        }}>
          <label className="p-field">
            <span>Invite code</span>
            <input type="text" required autoCapitalize="characters" autoComplete="off" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <NameField value={me} onChange={setMe} />
          <Button type="submit" disabled={busy || !code.trim() || !me.trim()}>Join</Button>
          {err && <p role="alert" className="p-error">{err}</p>}
        </form>
      </Card>
    </>
  )
}

/** The last 7 days, oldest first, ending today (study days, local). */
function lastWeek(): { days: string[]; labels: string[] } {
  const end = new Date(today() + 'T12:00:00Z')
  const days = Array.from({ length: 7 }, (_, i) => new Date(end.getTime() - (6 - i) * 864e5).toISOString().slice(0, 10))
  const labels = days.map((d) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')))
  return { days, labels }
}

function CircleView({ id, userId }: { id: string; userId: string }) {
  const [circle, setCircle] = useState<CircleRow | null | undefined>(undefined)
  const [week, setWeek] = useState<{ user_id: string; display_name: string; is_me: boolean; days: string[] }[] | null>(null)
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState<'leave' | 'delete' | null>(null)
  const [removing, setRemoving] = useState<{ user_id: string; display_name: string } | null>(null)

  const load = useCallback(async () => {
    const [c, w] = await Promise.all([
      supabase!.from('circles').select('id, name, invite_code, owner').eq('id', id).maybeSingle(),
      supabase!.rpc('circle_week', { p_circle: id }),
    ])
    if (c.error) setErr(c.error.message)
    setCircle(c.data ?? null)
    if (!w.error) setWeek(w.data ?? [])
  }, [id])
  useEffect(() => { void load() }, [load])

  if (circle === undefined) return <Skeleton lines={4} label="Loading circle…" />
  if (!circle) return <EmptyState title="Circle not found" action={<Button href="#/circle">Your circles</Button>}>{err || 'You may have left it, or it was deleted.'}</EmptyState>

  const { days, labels } = lastWeek()
  const owner = circle.owner === userId
  const rpc = async (fn: string, args: Record<string, unknown>) => {
    setErr('')
    const { error } = await supabase!.rpc(fn, args)
    if (error) setErr(error.message)
    else await load()
    return !error
  }
  const leave = async () => {
    const r = owner
      ? await supabase!.from('circles').delete().eq('id', id)
      : await supabase!.from('circle_members').delete().eq('circle_id', id).eq('user_id', userId)
    if (r.error) return setErr(r.error.message)
    navigate('circle')
  }

  return (
    <div className="p-stack">
      <OrnHeading>{circle.name}</OrnHeading>
      <Card eyebrow="This week">
        {week === null ? <Skeleton lines={3} /> : week.length ? (
          <ul className="circle-week">
            {week.map((m, i) => {
              const studied = new Set(m.days)
              const marks: DayMark[] = days.map((d) => (studied.has(d) ? 'studied' : 'not'))
              return (
                <li key={i}>
                  <span>{m.display_name}{m.is_me && <small className="muted"> (you)</small>}</span>
                  <ProgressDots days={marks} today={6} labels={labels} />
                  {owner && !m.is_me && (
                    <button type="button" className="p-linkbtn" onClick={() => setRemoving(m)}>Remove {m.display_name}</button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : <p className="muted">No members yet.</p>}
        <p className="t-sm muted">A filled dot is a day that member studied. Days run {labels[0]} to {labels[6]} (today).</p>
      </Card>

      {removing && (
        <Card level="e2">
          <p>Remove {removing.display_name} from this circle? They can join again only with the code, so change the code too if you do not want that.</p>
          <div className="p-actions">
            <Button variant="danger" onClick={async () => { if (await rpc('remove_member', { p_circle: id, p_user: removing.user_id })) setRemoving(null) }}>Remove</Button>
            <Button variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      <OrnHeading>Invite</OrnHeading>
      <Card>
        <p>Code: <span className="acc-code">{circle.invite_code}</span></p>
        <CopyField text={inviteLink(circle.invite_code)} label="Invite link" />
        <p className="t-sm muted">Anyone with the code or link who signs in can join (up to 20 members).</p>
        {owner && <Button variant="secondary" onClick={() => void rpc('rotate_invite', { p_circle: id })}>Change the code</Button>}
        {owner && <p className="t-sm muted">Changing the code stops the old code and link from working. Members stay in the circle.</p>}
      </Card>

      {owner && <RenameForm id={id} name={circle.name} onDone={load} />}

      {confirm ? (
        <Card level="e2">
          <p>{confirm === 'delete' ? 'Delete this circle for everyone? Members keep their own progress.' : 'Leave this circle? You can join again with the code.'}</p>
          <div className="p-actions">
            <Button variant="danger" onClick={leave}>{confirm === 'delete' ? 'Delete circle' : 'Leave'}</Button>
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          </div>
        </Card>
      ) : (
        <Button variant="ghost" onClick={() => setConfirm(owner ? 'delete' : 'leave')}>{owner ? 'Delete circle' : 'Leave circle'}</Button>
      )}
      {err && <p role="alert" className="p-error">{err}</p>}
    </div>
  )
}

function RenameForm({ id, name, onDone }: { id: string; name: string; onDone: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(name)
  const [err, setErr] = useState('')
  if (!open) return <Button variant="ghost" onClick={() => { setValue(name); setOpen(true) }}>Rename circle</Button>
  return (
    <Card>
      <form className="p-stack" onSubmit={async (e) => {
        e.preventDefault()
        setErr('')
        const { error } = await supabase!.from('circles').update({ name: value.trim() }).eq('id', id)
        if (error) return setErr(error.message)
        setOpen(false)
        await onDone()
      }}>
        <label className="p-field">
          <span>Circle name</span>
          <input type="text" dir="auto" maxLength={60} required value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <div className="p-actions">
          <Button type="submit" disabled={!value.trim()}>Save</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
        {err && <p role="alert" className="p-error">{err}</p>}
      </form>
    </Card>
  )
}
