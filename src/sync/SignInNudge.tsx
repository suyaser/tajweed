import { useState } from 'react'
import { useData } from '../core/store'
import { Button, Nudge } from '../components'
import { supabase } from './supabase'
import { useSync, type SyncState } from './sync'
import './sync.css'
import { t } from '../i18n'

const DISMISS_KEY = 'tajweed-path:signin-nudge-dismissed'
const WEEK = 7 * 24 * 3600 * 1000

function dismissedRecently(): boolean {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < WEEK } catch { return false }
}

/** "2 min ago", "3 h ago", "yesterday". */
export function ago(at: number, now = Date.now()): string {
  const m = Math.round((now - at) / 60000)
  if (m < 1) return t('just now')
  if (m < 60) return t('{n} min ago', { n: m })
  const h = Math.round(m / 60)
  if (h < 24) return t('{n} h ago', { n: h })
  const d = Math.round(h / 24)
  return d === 1 ? t('yesterday') : t('{n} days ago', { n: d })
}

/** One line for the sync state: "Backed up · synced 2 min ago", "Not backed up", … */
export function syncLabel(s: SyncState): string {
  if (!s.user) return t('Not backed up')
  if (s.status === 'syncing') return s.lastSyncedAt ? t('Backed up · syncing…') : t('Backing up…')
  if (s.status === 'offline') return s.lastSyncedAt ? t('Offline · last synced {ago}', { ago: ago(s.lastSyncedAt) }) : t('Offline · will back up when online')
  if (s.status === 'error') return t('Backup paused · could not sync')
  if (s.status === 'choose') return t('Backup paused · choose what to do with this device’s progress')
  return s.lastSyncedAt ? t('Backed up · synced {ago}', { ago: ago(s.lastSyncedAt) }) : t('Backed up')
}

/**
 * Honest sign-in prompt. Renders nothing unless: sign-in is available, the learner has at least one introduced lesson,
 * is not signed in, and has not tapped Later in the last 7 days. No props.
 */
export function SignInNudge() {
  const { introductions } = useData()
  const { user } = useSync()
  const [hidden, setHidden] = useState(dismissedRecently)
  if (!supabase || user || hidden || introductions.length === 0) return null
  const later = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* storage blocked: hide for this visit */ }
    setHidden(true)
  }
  return (
    <Nudge
      action={
        <span className="p-actions">
          <Button href="#/account">{t('Sign in')}</Button>
          <Button variant="ghost" onClick={later}>{t('Later')}</Button>
        </span>
      }
    >
      {t('Your progress is saved only on this device. Sign in to keep it safe and use it on any device.')}
    </Nudge>
  )
}

/** Small mark: "Not backed up" / "Backed up" (with a dot), linking to the Account screen. Optional `detail` shows the sync time. */
export function BackupBadge({ detail = false }: { detail?: boolean }) {
  const s = useSync()
  if (!supabase) return null
  const ok = !!s.user && s.status !== 'error' && s.status !== 'choose'
  return (
    <a className="backup-badge" data-ok={ok} href="#/account">
      <span aria-hidden="true">{ok ? '●' : '○'}</span> {detail ? syncLabel(s) : ok ? t('Backed up') : t('Not backed up')}

    </a>
  )
}
