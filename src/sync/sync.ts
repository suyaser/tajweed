// Background sync of the one UserData document (spec §6). Never blocks the UI: local data is always the working copy;
// the server copy is merged in (mergeData), so a conflict keeps both sides' rows instead of overwriting one.
// The first sync of an account on this device is special (firstSync): see merge.ts.
import { useSyncExternalStore } from 'react'
import type { User } from '@supabase/supabase-js'
import { defaultData, getLoadError, getSnapshot, importJson, resetAll, subscribe as onLocalChange, updateSettings } from '../core/store'
import { today } from '../core/day'
import { t } from '../i18n'
import { studiedDays } from '../screens/path/helpers'
import { firstSync, firstSyncDoc, mergeData, sameDoc } from './merge'
import { exchangeCodeFromUrl, getSupabase, hasBackend } from './supabase'

/** 'choose': another account synced on this device before; sync waits for the learner's choice on the Account screen. */
export type SyncStatus = 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error' | 'choose'
export interface SyncState { user: User | null; status: SyncStatus; lastSyncedAt: number | null; error?: string }

const PUSH_DELAY = 5000
let state: SyncState = { user: null, status: 'signed-out', lastSyncedAt: null }
const listeners = new Set<() => void>()
const set = (patch: Partial<SyncState>) => { state = { ...state, ...patch }; listeners.forEach(l => l()) }

export const getSyncState = () => state
export function useSync(): SyncState {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn) } }, getSyncState)
}

let running: Promise<void> | null = null
let again = false
let applying = false
let timer: ReturnType<typeof setTimeout> | undefined
let activityDay: string | null = null
let deleting = false // while the account is being deleted nothing may write the document back
let replaceRemote = false // a restored backup replaces the account copy instead of merging with it
let switchChoice: 'take-remote' | 'merge-account-settings' | null = null // the learner's answer to 'choose'

/** The account this device last synced with (null: none). The data on this device belongs to it. */
const ACCOUNT_KEY = 'tajweed-path:sync-account'
const lastAccount = (): string | null => { try { return localStorage.getItem(ACCOUNT_KEY) } catch { return null } }
const rememberAccount = (id: string | null) => {
  try { if (id) localStorage.setItem(ACCOUNT_KEY, id); else localStorage.removeItem(ACCOUNT_KEY) } catch { /* blocked: treated as a first sync next time */ }
}

/** Fetch → merge → import locally if changed → write back if changed. One run at a time; a request during a run queues one more. */
export function syncNow(): Promise<void> {
  if (running) { again = true; return running }
  running = run().finally(() => {
    running = null
    if (again) { again = false; void syncNow() }
  })
  return running
}

async function run() {
  const user = state.user
  const supabase = await getSupabase()
  if (!supabase || !user || deleting || getLoadError()) return // unreadable local data waits for Recovery: never overwrite it
  if (state.status === 'choose' && !switchChoice) return // paused until the learner chooses
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { set({ status: 'offline' }); return }
  set({ status: 'syncing', error: undefined })
  try {
    for (let tries = 0; tries < 3; tries++) {
      const { data: row, error } = await supabase.from('user_data').select('doc, updated_at').eq('user_id', user.id).maybeSingle()
      if (error) throw error
      if (state.user?.id !== user.id || deleting) return // signed out meanwhile
      const local = getSnapshot()
      let merged
      if (replaceRemote) merged = local
      else {
        const plan = firstSync(local, row?.doc, lastAccount(), user.id)
        const p = plan === 'ask' ? switchChoice : plan
        if (!p) { set({ status: 'choose' }); return }
        merged = p === 'merge' ? (row ? mergeData(local, row.doc) : local)
          : p === 'take-remote' && !row ? defaultData() // "use this account's data" and the account has none yet
          : firstSyncDoc(p, local, row?.doc)
      }
      if (!sameDoc(merged, local)) {
        applying = true
        try { importJson(JSON.stringify(merged)) } finally { applying = false } // validates; throws (nothing changed) on a newer schema
      }
      const doc = getSnapshot()
      if (row && sameDoc(doc, row.doc)) break
      // Write only over the version we merged with; if another device wrote meanwhile, merge again.
      const updated_at = new Date().toISOString()
      const res = row
        ? await supabase.from('user_data').update({ doc, updated_at }).eq('user_id', user.id).eq('updated_at', row.updated_at).select('user_id')
        : await supabase.from('user_data').insert({ user_id: user.id, doc, updated_at }).select('user_id')
      if (res.error?.code === '23503') return await accountGone() // the auth user is gone (deleted on another device)
      if (res.error && res.error.code !== '23505') throw res.error
      if (!res.error && res.data?.length) break
      if (tries === 2) throw new Error(t('Another device kept writing; will try again.'))
    }
    rememberAccount(user.id)
    replaceRemote = false
    switchChoice = null
    await recordActivity(user.id)
    set({ status: 'synced', lastSyncedAt: Date.now() })
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e)
    // Safari reports a dropped connection as "Load failed", Chrome as "Failed to fetch": both are fetch TypeErrors.
    const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) || e instanceof TypeError || /fetch|network|load failed/i.test(msg)
    set({ status: offline ? 'offline' : 'error', error: offline ? undefined : msg })
  }
}

/** One `activity` row per studied day, for circles. Best effort. */
async function recordActivity(userId: string) {
  const day = today()
  const supabase = await getSupabase()
  if (!supabase || activityDay === day || !studiedDays(getSnapshot()).has(day)) return
  const { error } = await supabase.from('activity').upsert({ user_id: userId, day }, { onConflict: 'user_id,day', ignoreDuplicates: true })
  if (!error) activityDay = day
}

const schedule = () => {
  if (applying || deleting || !state.user) return
  clearTimeout(timer)
  timer = setTimeout(() => void syncNow(), PUSH_DELAY)
}

let started = false
/** Once at startup: follow the session, local changes, focus and network, and finish a returning sign-in link. */
export async function startSync() {
  if (started || !hasBackend) return
  started = true
  const supabase = await getSupabase()
  if (!supabase) return
  // Listen before the code exchange: its session arrives as an auth event.
  supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null
    const changed = user?.id !== state.user?.id
    if (changed) { switchChoice = null; replaceRemote = false }
    set(user ? { user, ...(changed ? { status: 'syncing' as const, error: undefined } : {}) } : { user, status: 'signed-out', lastSyncedAt: null })
    if (!user) { activityDay = null; return }
    // Supabase advises no awaits inside this callback: run the sync on the next tick.
    if (changed || event === 'SIGNED_IN') setTimeout(() => void syncNow(), 0)
  })
  onLocalChange(schedule)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void syncNow() })
  window.addEventListener('online', () => void syncNow())
  window.addEventListener('offline', () => { if (state.user && state.status !== 'choose') set({ status: 'offline' }) })
  await Promise.race([exchangeCodeFromUrl(), new Promise(r => setTimeout(r, 15000))]) // a hung exchange must not hold anything up
}

/* ---------------- account actions ---------------- */

export async function sendEmailLink(email: string, redirectTo: string) {
  const supabase = await getSupabase()
  if (!supabase) throw new Error(t('Sign-in is not available in this build.'))
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
  if (error) throw error
}

export async function signInWithGoogle(redirectTo: string) {
  const supabase = await getSupabase()
  if (!supabase) throw new Error(t('Sign-in is not available in this build.'))
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  if (error) throw error
}

/** Signs out on this device. Local progress stays. */
export async function signOut() {
  clearTimeout(timer)
  switchChoice = null
  await (await getSupabase())?.auth.signOut({ scope: 'local' })
  set({ user: null, status: 'signed-out', lastSyncedAt: null })
}

/** The answer to 'choose': use the account's copy on this device, or merge this device's progress into the account. */
export function chooseAccountData(choice: 'replace' | 'merge') {
  switchChoice = choice === 'replace' ? 'take-remote' : 'merge-account-settings'
  return syncNow()
}

/** Settings → Reset. Signs out first (the account copy stays as it is), then this device forgets the account and starts fresh. */
export async function resetThisDevice() {
  if (state.user) await signOut()
  rememberAccount(null)
  resetAll()
}

/** Settings → Restore. Throws (nothing changed) on a bad file. Signed in: the backup replaces the account copy, no merge. */
export function restoreBackup(text: string) {
  importJson(text)
  if (!state.user) return
  updateSettings({}) // a newer settings stamp, so other devices take the restored settings
  replaceRemote = true
  clearTimeout(timer)
  void syncNow()
}

/** Deletes the account: auth.users cascades to the document, links, circles, memberships and activity. Then signs out here. */
export async function deleteAccount() {
  const supabase = await getSupabase()
  if (!supabase || !state.user) return
  deleting = true
  clearTimeout(timer)
  try {
    await running?.catch(() => {})
    const { error } = await supabase.rpc('delete_me')
    if (error) throw error
    rememberAccount(null)
    await signOut()
  } finally {
    deleting = false
  }
}

/** Another device deleted this account: stop, sign out here and keep local progress. Never re-create the document. */
async function accountGone() {
  rememberAccount(null)
  await signOut()
  set({ error: t('This account was deleted. You are signed out on this device; your progress here is kept.') })
}
