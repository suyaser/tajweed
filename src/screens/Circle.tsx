// Private circles (حلقة): #/circle lists, creates and joins; #/circle/:id shows who studied which day this week.
// No scores, no ranks, no public listing (spec §6).
import { useCallback, useEffect, useState } from 'react'
import { Actions, Button, Confirm, EmptyState, Field, Group, Msg, Row, Skeleton, fieldCls } from '../components'
import { Page } from '@/components/kit'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { navigate } from '../app/router'
import { today } from '../core/day'
import { getSupabase, hasBackend } from '../sync/supabase'
import { useSync } from '../sync/sync'
import { CopyField } from '../sync/CopyField'
import { locale, t } from '../i18n'

interface CircleRow { id: string; name: string; invite_code: string; owner: string }
const NAME_KEY = 'tajweed-path:circle-name'
const savedName = () => { try { return localStorage.getItem(NAME_KEY) ?? '' } catch { return '' } }
const saveName = (n: string) => { try { localStorage.setItem(NAME_KEY, n) } catch { /* blocked */ } }
const inviteLink = (code: string) => `${location.origin}${location.pathname}#/circle?join=${encodeURIComponent(code)}`

export default function Circle({ params }: { params: Record<string, string> }) {
  const { user } = useSync()
  if (!hasBackend) return <Page><EmptyState icon="groups" title={t('Circles are not available in this version of the app.')} /></Page>
  if (!user)
    return (
      <Page>
        <EmptyState icon="groups" title={t('Study together in a circle')} action={<Button href="#/account">{t('Sign in')}</Button>}>
          {t('A circle is a small private group (up to 20) that sees who studied which day this week. Sign in to create or join one.')}
          {params.join ? ' ' + t('After signing in, open the invite link again to join.') : ''}
        </EmptyState>
      </Page>
    )
  return <Page>{params.id ? <CircleView id={params.id} userId={user.id} /> : <Circles join={params.join} />}</Page>
}

function Circles({ join }: { join?: string }) {
  const [list, setList] = useState<CircleRow[] | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    getSupabase().then((sb) => sb!.from('circles').select('id, name, invite_code, owner').order('created_at')).then(({ data, error }) => {
      if (error) setErr(error.message)
      setList(data ?? [])
    })
  }, [])

  return (
    <>
      {join && <JoinForm initialCode={join} />}
      <Group en="Your circles" ar="حلقاتك">
        {list === null ? <div className="p-space-md"><Skeleton lines={2} /></div> : list.length ? (
          <ul className="flex flex-col divide-y divide-outline-variant">
            {list.map((c) => <li key={c.id}><Row icon="groups" href={`#/circle/${c.id}`} label={<bdi>{c.name}</bdi>} /></li>)}
          </ul>
        ) : <p className="p-space-md text-on-surface-variant">{t('You are not in a circle yet. Create one and invite your friends, or join with a code.')}</p>}
        {err && <Msg error className="p-space-md">{err}</Msg>}
      </Group>
      <CreateForm />
      {!join && <JoinForm />}
      <p className="text-body-md text-on-surface-variant">{t("Members see each other's name and which days they studied this week. Nothing else: no scores, no lessons, no ranking.")}</p>
    </>
  )
}

function NameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label={t('Your name in the circle')}>
      <input type="text" dir="auto" maxLength={40} required className={fieldCls()} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

function CreateForm() {
  const [name, setName] = useState('')
  const [me, setMe] = useState(savedName)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <Group en="Create a circle" ar="أنشئ حلقة">
        <form className="flex flex-col gap-space-md p-space-md" onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true); setErr('')
          const { data, error } = await (await getSupabase())!.rpc('create_circle', { p_name: name.trim(), p_display_name: me.trim() })
          setBusy(false)
          if (error) return setErr(error.message)
          saveName(me.trim())
          navigate(`circle/${data}`)
        }}>
          <Field label={t('Circle name')}>
            <input type="text" dir="auto" maxLength={60} required className={fieldCls()} value={name} onChange={(e) => setName(e.target.value)} placeholder="حلقة الفجر" />
          </Field>
          <NameField value={me} onChange={setMe} />
          <Button type="submit" variant="secondary" className="self-start" disabled={busy || !name.trim() || !me.trim()}><Icon name="add" size={20} />{t('Create')}</Button>
          {err && <Msg error>{err}</Msg>}
        </form>
    </Group>
  )
}

function JoinForm({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode)
  const [me, setMe] = useState(savedName)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <Group en="Join a circle" ar="انضم إلى حلقة">
        <form className="flex flex-col gap-space-md p-space-md" onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true); setErr('')
          const { data, error } = await (await getSupabase())!.rpc('join_circle', { p_code: code.trim(), p_name: me.trim() })
          setBusy(false)
          if (error) return setErr(error.message)
          if (!data) return setErr(t('That code did not work. Check it with whoever invited you and try again.'))
          saveName(me.trim())
          navigate(`circle/${data}`)
        }}>
          <Field label={t('Invite code')}>
            <input type="text" dir="ltr" required autoCapitalize="characters" autoComplete="off" spellCheck={false} className={fieldCls('font-mono tracking-widest')} value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <NameField value={me} onChange={setMe} />
          <Button type="submit" variant="secondary" className="self-start" disabled={busy || !code.trim() || !me.trim()}><Icon name="login" size={20} />{t('Join')}</Button>
          {err && <Msg error>{err}</Msg>}
        </form>
    </Group>
  )
}

/** The last 7 days, oldest first, ending today (study days, local). */
function lastWeek(): { days: string[]; labels: string[] } {
  const end = new Date(today() + 'T12:00:00Z')
  const days = Array.from({ length: 7 }, (_, i) => new Date(end.getTime() - (6 - i) * 864e5).toISOString().slice(0, 10))
  const labels = days.map((d) => new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')))
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
      (await getSupabase())!.from('circles').select('id, name, invite_code, owner').eq('id', id).maybeSingle(),
      (await getSupabase())!.rpc('circle_week', { p_circle: id }),
    ])
    if (c.error) setErr(c.error.message)
    setCircle(c.data ?? null)
    if (!w.error) setWeek(w.data ?? [])
  }, [id])
  useEffect(() => { void load() }, [load])

  if (circle === undefined) return <Skeleton lines={4} label={t('Loading circle…')} />
  if (!circle) return <EmptyState title={t('Circle not found')} action={<Button href="#/circle">{t('Your circles')}</Button>}>{err || t('You may have left it, or it was deleted.')}</EmptyState>

  const { days, labels } = lastWeek()
  const owner = circle.owner === userId
  const rpc = async (fn: string, args: Record<string, unknown>) => {
    setErr('')
    const { error } = await (await getSupabase())!.rpc(fn, args)
    if (error) setErr(error.message)
    else await load()
    return !error
  }
  const leave = async () => {
    const r = owner
      ? await (await getSupabase())!.from('circles').delete().eq('id', id)
      : await (await getSupabase())!.from('circle_members').delete().eq('circle_id', id).eq('user_id', userId)
    if (r.error) return setErr(r.error.message)
    navigate('circle')
  }

  return (
    <>
      <header className="flex items-center gap-space-md">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-container text-on-primary-container"><Icon name="groups" /></span>
        <h2 className="min-w-0 text-headline-lg break-words"><bdi>{circle.name}</bdi></h2>
      </header>
      <Group en="This week" ar="هذا الأسبوع">
        {week === null ? <div className="p-space-md"><Skeleton lines={3} /></div> : week.length ? (
          <ul className="flex flex-col divide-y divide-outline-variant">
            {week.map((m, i) => {
              const studied = new Set(m.days)
              const n = days.filter((d) => studied.has(d)).length
              return (
                <li key={i} className="flex flex-col gap-space-sm p-space-md">
                  <div className="flex flex-wrap items-center justify-between gap-space-sm">
                    <span className="text-body-lg font-medium"><bdi>{m.display_name}</bdi>{m.is_me && <small className="text-on-surface-variant"> {t('(you)')}</small>}</span>
                    {owner && !m.is_me && (
                      <Button variant="ghost" className="text-error" onClick={() => setRemoving(m)}>{t('Remove {name}', { name: m.display_name })}</Button>
                    )}
                  </div>
                  <ol className="grid grid-cols-7 gap-1" aria-label={n === 1 ? t('1 day studied this week') : t('{n} days studied this week', { n })}>
                    {days.map((d, j) => {
                      const on = studied.has(d)
                      return (
                        <li key={d} className="flex flex-col items-center gap-1">
                          <span className={cn('text-caption', j === 6 ? 'font-bold text-primary' : 'text-on-surface-variant')} aria-hidden="true">{labels[j]}</span>
                          <span aria-hidden="true" className={cn('grid size-8 place-items-center rounded-full',
                            on ? 'bg-primary-fill text-on-primary' : 'bg-surface-container', j === 6 && !on && 'ring-2 ring-gold')}>
                            {on && <Icon name="check" size={18} />}
                          </span>
                          <span className="sr-only">{`${labels[j]}: ${on ? t('studied') : t('not studied')}`}</span>
                        </li>
                      )
                    })}
                  </ol>
                </li>
              )
            })}
          </ul>
        ) : <p className="p-space-md text-on-surface-variant">{t('No members yet.')}</p>}
        <p className="p-space-md text-body-md text-on-surface-variant">{t('A filled dot is a day that member studied. Days run {from} to {to} (today).', { from: labels[0], to: labels[6] })}</p>
      </Group>

      {removing && (
        <Confirm label={t('Remove {name}', { name: removing.display_name })}>
          <p>{t('Remove {name} from this circle? They can join again only with the code, so change the code too if you do not want that.', { name: removing.display_name })}</p>
          <Actions>
            <Button variant="danger" onClick={async () => { if (await rpc('remove_member', { p_circle: id, p_user: removing.user_id })) setRemoving(null) }}>{t('Remove')}</Button>
            <Button variant="ghost" onClick={() => setRemoving(null)}>{t('Cancel')}</Button>
          </Actions>
        </Confirm>
      )}

      <Group en="Invite" ar="الدعوة">
        <div className="flex flex-col gap-space-sm p-space-md">
          <p>{t('Code:')} <bdi dir="ltr" className="rounded-sm bg-surface-container px-2 py-0.5 font-mono text-body-lg tracking-widest">{circle.invite_code}</bdi></p>
          <CopyField text={inviteLink(circle.invite_code)} label={t('Invite link')} />
          <p className="text-body-md text-on-surface-variant">{t('Anyone with the code or link who signs in can join (up to 20 members).')}</p>
          {owner && <Button variant="secondary" className="self-start" onClick={() => void rpc('rotate_invite', { p_circle: id })}><Icon name="autorenew" size={20} />{t('Change the code')}</Button>}
          {owner && <p className="text-body-md text-on-surface-variant">{t('Changing the code stops the old code and link from working. Members stay in the circle.')}</p>}
        </div>
      </Group>

      {owner && <RenameForm id={id} name={circle.name} onDone={load} />}

      {confirm ? (
        <Confirm label={confirm === 'delete' ? t('Delete circle') : t('Leave circle')}>
          <p>{confirm === 'delete' ? t('Delete this circle for everyone? Members keep their own progress.') : t('Leave this circle? You can join again with the code.')}</p>
          <Actions>
            <Button variant="danger" onClick={leave}>{confirm === 'delete' ? t('Delete circle') : t('Leave')}</Button>
            <Button variant="ghost" onClick={() => setConfirm(null)}>{t('Cancel')}</Button>
          </Actions>
        </Confirm>
      ) : (
        <Button variant="ghost" className="self-start text-error" onClick={() => setConfirm(owner ? 'delete' : 'leave')}>
          <Icon name={owner ? 'delete' : 'logout'} size={20} />{owner ? t('Delete circle') : t('Leave circle')}
        </Button>
      )}
      {err && <Msg error>{err}</Msg>}
    </>
  )
}

function RenameForm({ id, name, onDone }: { id: string; name: string; onDone: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(name)
  const [err, setErr] = useState('')
  if (!open) return <Button variant="ghost" className="self-start" onClick={() => { setValue(name); setOpen(true) }}><Icon name="edit" size={20} />{t('Rename circle')}</Button>
  return (
    <Group en="Rename circle" ar="إعادة تسمية الحلقة">
      <form className="flex flex-col gap-space-md p-space-md" onSubmit={async (e) => {
        e.preventDefault()
        setErr('')
        const { error } = await (await getSupabase())!.from('circles').update({ name: value.trim() }).eq('id', id)
        if (error) return setErr(error.message)
        setOpen(false)
        await onDone()
      }}>
        <Field label={t('Circle name')}>
          <input type="text" dir="auto" maxLength={60} required className={fieldCls()} value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <Actions>
          <Button type="submit" disabled={!value.trim()}>{t('Save')}</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t('Cancel')}</Button>
        </Actions>
        {err && <Msg error>{err}</Msg>}
      </form>
    </Group>
  )
}
