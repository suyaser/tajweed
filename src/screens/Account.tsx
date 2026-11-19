import { useEffect, useState } from 'react'
import { Button, Card, OrnHeading } from '../components'
import { authError, clearAuthError, redirectUrl, supabase } from '../sync/supabase'
import { deleteServerData, sendEmailLink, signInWithGoogle, signOut, syncNow, useSync, type SyncState } from '../sync/sync'
import { syncLabel } from '../sync/SignInNudge'
import './path.css'
import '../sync/sync.css'

export default function Account() {
  const s = useSync()
  const [, tick] = useState(0)
  const [notice, setNotice] = useState('')
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t) }, []) // keeps "2 min ago" fresh

  if (!supabase) return <Card><p>Sign-in is not available in this version of the app. Your progress stays on this device; use Back up in Settings.</p></Card>

  return (
    <div className="p-stack">
      {authError && (
        <p role="alert" className="p-error">
          Sign-in did not finish: {authError}{' '}
          <button type="button" className="p-linkbtn" onClick={() => { clearAuthError(); tick((n) => n + 1) }}>Dismiss</button>
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {s.user ? <SignedIn s={s} onDeleted={setNotice} /> : <SignIn />}
    </div>
  )
}

function SignedIn({ s, onDeleted }: { s: SyncState; onDeleted: (msg: string) => void }) {
    const [confirm, setConfirm] = useState(false)
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
    return (
      <>
        <OrnHeading>Account and backup</OrnHeading>
        <Card>
          <p>Signed in as <span className="acc-email">{s.user!.email ?? 'your account'}</span></p>
          <p role="status">{syncLabel(s)}</p>
          {s.status === 'error' && <p className="t-sm p-error">{s.error}. Your progress is safe on this device.</p>}
          <p className="t-sm muted">Your progress and settings are backed up and kept the same on every device where you sign in. Recordings stay on each device.</p>
          <div className="p-actions">
            <Button variant="secondary" onClick={() => void syncNow()} disabled={s.status === 'syncing'}>Sync now</Button>
            <Button variant="ghost" onClick={() => void signOut()}>Sign out</Button>
          </div>
          <p className="t-sm muted">Signing out keeps everything on this device.</p>
        </Card>

        <OrnHeading>Delete my data</OrnHeading>
        <Card>
          {!confirm ? (
            <Button variant="danger" onClick={() => setConfirm(true)}>Delete my data from the server</Button>
          ) : (
            <div className="p-confirm" role="alertdialog" aria-label="Delete your data from the server?">
              <p>
                This deletes your backed-up progress, your teacher links, your circles and memberships, and your study days from the server, then
                signs you out. Your progress on this device stays.
              </p>
              <div className="p-actions">
                <Button variant="danger" disabled={busy} onClick={async () => {
                  setBusy(true)
                  try { await deleteServerData(); onDeleted('Deleted from the server. You are signed out; your progress is still on this device.'); return }
                  catch (e) { setMsg({ ok: false, text: `Not deleted: ${(e as Error).message}` }) }
                  setBusy(false); setConfirm(false)
                }}>Delete</Button>
                <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
              </div>
            </div>
          )}
          {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? '' : 'p-error'}>{msg.text}</p>}
          <p className="t-sm muted">The sign-in account itself (your email address) can be removed on request: write to the app's maintainer.</p>
        </Card>
      </>
    )
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try { await sendEmailLink(email.trim(), redirectUrl()); setSent(email.trim()) }
    catch (x) { setErr((x as Error).message) }
    setBusy(false)
  }

  return (
    <>
      <OrnHeading>Account and backup</OrnHeading>
      <Card>
        <p>Your progress is saved only on this device. Sign in to keep it safe and use it on any device. Signing in is optional; the app works fully without it.</p>
        {sent ? (
          <div role="status" className="p-stack">
            <p><b>Check your email.</b> We sent a sign-in link to <span className="acc-email">{sent}</span>. Open it on this device, in this browser.</p>
            <button type="button" className="p-linkbtn" onClick={() => setSent(null)}>Use a different email</button>
          </div>
        ) : (
          <form className="p-stack" onSubmit={send}>
            <label className="p-field">
              <span>Email</span>
              <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <Button type="submit" disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send link'}</Button>
          </form>
        )}
        <p className="acc-or">or</p>
        <Button variant="secondary" onClick={() => signInWithGoogle(redirectUrl()).catch((x) => setErr((x as Error).message))}>Continue with Google</Button>
        {err && <p role="alert" className="p-error">{err}</p>}
        <p className="t-sm muted">
          When you sign in, what is on this device is merged with what is already backed up: nothing is lost. Recordings never leave this device.
        </p>
      </Card>
    </>
  )
}
