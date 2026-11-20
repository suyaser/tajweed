import { useEffect, useState } from 'react'
import { Actions, Button, Confirm, Field, Group, Msg, Row, T, fieldCls } from '../components'
import { Page } from '@/components/kit'
import { Icon } from '@/components/ui/icon'

import { authError, clearAuthError, hasBackend, redirectUrl } from '../sync/supabase'
import { chooseAccountData, deleteAccount, sendEmailLink, signInWithGoogle, signOut, syncNow, useSync, type SyncState } from '../sync/sync'
import { syncLabel } from '../sync/SignInNudge'
import { t } from '../i18n'

export default function Account() {
  const s = useSync()
  const [, tick] = useState(0)
  const [notice, setNotice] = useState('')
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(id) }, []) // keeps "2 min ago" fresh

  if (!hasBackend) return <Page width="narrow"><Group en="Account and backup" ar="الحساب والنسخ الاحتياطي"><p className="p-space-md">{t('Sign-in is not available in this version of the app. Your progress stays on this device; use Back up in Settings.')}</p></Group></Page>

  return (
    <Page width="narrow">
      {authError && (
        <div role="alert" className="flex flex-wrap items-center gap-space-sm rounded-card bg-error-container p-space-md text-on-error-container">
          <span className="flex-1">{t('Sign-in did not finish:')} {authError}</span>
          <Button variant="ghost" onClick={() => { clearAuthError(); tick((n) => n + 1) }}>{t('Dismiss')}</Button>
        </div>
      )}
      {notice && <Msg>{notice}</Msg>}
      {!s.user && s.error && <Msg>{s.error}</Msg>}
      {s.user ? <SignedIn s={s} onDeleted={setNotice} /> : <SignIn />}
    </Page>
  )
}

function SignedIn({ s, onDeleted }: { s: SyncState; onDeleted: (msg: string) => void }) {
    const [confirm, setConfirm] = useState(false)
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
    return (
      <>
        <Group en="Account and backup" ar="الحساب والنسخ الاحتياطي">
          <Row icon="account_circle" label={<>{t('Signed in as')} <bdi className="break-all">{s.user!.email ?? t('your account')}</bdi></>}
            hint={<span role="status">{syncLabel(s)}</span>} />
          {s.status === 'choose' && <div className="p-space-md"><AccountSwitch /></div>}
          {s.status === 'error' && <Msg error className="p-space-md">{s.error}{t('. Your progress is safe on this device.')}</Msg>}
          <div className="flex flex-col gap-space-sm p-space-md">
            <p className="text-body-md text-on-surface-variant">{t('Your progress and settings are backed up and kept the same on every device where you sign in. Recordings stay on each device.')}</p>
            <Actions>
              <Button variant="secondary" onClick={() => void syncNow()} disabled={s.status === 'syncing'}><Icon name="sync" size={20} />{t('Sync now')}</Button>
              <Button variant="ghost" onClick={() => void signOut()}><Icon name="logout" size={20} />{t('Sign out')}</Button>
            </Actions>
            <p className="text-body-md text-on-surface-variant">{t('Signing out keeps everything on this device.')}</p>
          </div>
        </Group>

        <Group en="Delete my data" ar="حذف بياناتي">
          <div className="flex flex-col gap-space-sm p-space-md">
            {!confirm ? (
              <Button variant="danger" className="self-start" onClick={() => setConfirm(true)}>{t('Delete my account')}</Button>
            ) : (
              <Confirm label={t('Delete your account?')}>
                <p>
                  {t('This deletes your account (your sign-in), your backed-up progress, your teacher links, your circles and memberships, and your study days from the server, then signs you out. Other signed-in devices are signed out when they next sync. Your progress on this device stays.')}
                </p>
                <Actions>
                  <Button variant="danger" disabled={busy} onClick={async () => {
                    setBusy(true)
                    try { await deleteAccount(); onDeleted(t('Your account is deleted. You are signed out; your progress is still on this device.')); return }
                    catch (e) { setMsg({ ok: false, text: t('Not deleted: {reason}', { reason: (e as Error).message }) }) }
                    setBusy(false); setConfirm(false)
                  }}>{t('Delete')}</Button>
                  <Button variant="ghost" onClick={() => setConfirm(false)}>{t('Cancel')}</Button>
                </Actions>
              </Confirm>
            )}
            {msg && <Msg error={!msg.ok}>{msg.text}</Msg>}
          </div>
        </Group>
      </>
    )
}

/** Another account synced on this device before (a shared device): never mix two people's progress without asking. */
function AccountSwitch() {
  const [busy, setBusy] = useState(false)
  const pick = (c: 'replace' | 'merge') => { setBusy(true); void chooseAccountData(c).finally(() => setBusy(false)) }
  return (
    <Confirm label={t("This device has someone else's progress")}>
      <p>
        {t('The progress on this device was backed up to a')} <b>{t('different account')}</b>{t('. Backup is paused until you choose. Nothing has been changed yet.')}
      </p>
      <div className="flex flex-col gap-space-sm [&>*]:h-auto [&>*]:min-h-12 [&>*]:whitespace-normal">
        <Button disabled={busy} onClick={() => pick('replace')}>{t("Use this account's data (replace this device's)")}</Button>
        <Button variant="secondary" disabled={busy} onClick={() => pick('merge')}>{t("Merge this device's progress into this account")}</Button>
        <Button variant="ghost" disabled={busy} onClick={() => void signOut()}>{t('Cancel (sign out)')}</Button>
      </div>
      <p className="text-on-surface-variant">{t("Replace: this device shows this account's progress; the other account's copy on the server is not touched.")}</p>
    </Confirm>
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
    <Group en="Account and backup" ar="الحساب والنسخ الاحتياطي">
      <div className="flex flex-col gap-space-md p-space-md sm:p-space-lg">
        <div className="flex items-start gap-space-md">
          <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-container text-on-surface-variant"><Icon name="cloud_off" size={22} /></span>
          <p className="text-body-lg">{t('Your progress is saved only on this device. Sign in to keep it safe and use it on any device. Signing in is optional; the app works fully without it.')}</p>
        </div>
        {sent ? (
          <div role="status" className="flex flex-col items-start gap-space-sm rounded-control bg-primary-container p-space-md text-on-primary-container">
            <p><b>{t('Check your email.')}</b> {t('We sent a sign-in link to')} <bdi className="break-all">{sent}</bdi>{t('. Open it on this device, in this browser.')}</p>
            <Button variant="tertiary" className="px-0" onClick={() => setSent(null)}>{t('Use a different email')}</Button>
          </div>
        ) : (
          <form className="flex flex-col gap-space-sm" onSubmit={send}>
            <Field label={t('Email')}>
              <input type="email" dir="ltr" required autoComplete="email" inputMode="email" className={fieldCls()} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button type="submit" disabled={busy || !email.trim()}><Icon name="mail" size={20} />{busy ? t('Sending…') : t('Send link')}</Button>
          </form>
        )}
        <p className="flex items-center gap-space-sm text-label text-on-surface-variant before:h-px before:flex-1 before:bg-outline-variant after:h-px after:flex-1 after:bg-outline-variant">{t('or')}</p>
        <Button variant="secondary" onClick={() => signInWithGoogle(redirectUrl()).catch((x) => setErr((x as Error).message))}><T>{t('Continue with Google')}</T></Button>
        {err && <Msg error>{err}</Msg>}
        <p className="text-body-md text-on-surface-variant">
          {t("When you sign in, what is on this device is merged with what is already backed up: nothing is lost. If this device has no progress yet, it takes the account's progress and settings. Recordings never leave this device.")}
        </p>
      </div>
    </Group>
  )
}
