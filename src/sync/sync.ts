// Background sync of the one UserData document (spec §6). Never blocks the UI: local data is always the working copy;
// the server copy is merged in (mergeData), so a conflict keeps both sides' rows instead of overwriting one.
import { useSyncExternalStore } from 'react'
import type { User } from '@supabase/supabase-js'
import { getLoadError, getSnapshot, importJson, subscribe as onLocalChange } from '../core/store'
import { today } from '../core/day'
import { studiedDays } from '../screens/path/helpers'
import { mergeData, sameDoc } from './merge'
import { exchangeCodeFromUrl, supabase } from './supabase'

export type SyncStatus = 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error'
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
  if (!supabase || !user || getLoadError()) return // unreadable local data waits for Recovery: never overwrite it
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { set({ status: 'offline' }); return }
  set({ status: 'syncing', error: undefined })
  try {
    for (let tries = 0; tries < 3; tries++) {
      const { data: row, error } = await supabase.from('user_data').select('doc, updated_at').eq('user_id', user.id).maybeSingle()
      if (error) throw error
      if (state.user?.id !== user.id) return // signed out meanwhile
      const local = getSnapshot()
      const merged = row ? mergeData(local, row.doc) : local
      if (!sameDoc(merged, local)) {
        applying = true
        try { importJson(JSON.stringify(merged)) } finally { applying = false } // validates; throws on a newer schema
      }
      const doc = getSnapshot()
      if (row && sameDoc(doc, row.doc)) break
      // Write only over the version we merged with; if another device wrote meanwhile, merge again.
      const updated_at = new Date().toISOString()
      const res = row
        ? await supabase.from('user_data').update({ doc, updated_at }).eq('user_id', user.id).eq('updated_at', row.updated_at).select('user_id')
        : await supabase.from('user_data').insert({ user_id: user.id, doc, updated_at }).select('user_id')
      if (res.error && res.error.code !== '23505') throw res.error
      if (!res.error && res.data?.length) break
      if (tries === 2) throw new Error('Another device kept writing; will try again.')
    }
    await recordActivity(user.id)
    set({ status: 'synced', lastSyncedAt: Date.now() })
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e)
    const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) || /fetch|network/i.test(msg)
    set({ status: offline ? 'offline' : 'error', error: offline ? undefined : msg })
  }
}

/** One `activity` row per studied day, for circles. Best effort. */
async function recordActivity(userId: string) {
  const day = today()
  if (!supabase || activityDay === day || !studiedDays(getSnapshot()).has(day)) return
  const { error } = await supabase.from('activity').upsert({ user_id: userId, day }, { onConflict: 'user_id,day', ignoreDuplicates: true })
  if (!error) activityDay = day
}

const schedule = () => {
  if (applying || !state.user) return
  clearTimeout(timer)
  timer = setTimeout(() => void syncNow(), PUSH_DELAY)
}

let started = false
/** Once at startup: finish a returning sign-in link, then follow the session, local changes, focus and network. */
export async function startSync() {
  if (started || !supabase) return
  started = true
  const sb = supabase
  await exchangeCodeFromUrl()
  sb.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null
    const changed = user?.id !== state.user?.id
    set({ user, ...(user ? {} : { status: 'signed-out' as const, lastSyncedAt: null }) })
    if (!user) { activityDay = null; return }
    // Supabase advises no awaits inside this callback: run the sync on the next tick.
    if (changed || event === 'SIGNED_IN') setTimeout(() => void syncNow(), 0)
  })
  onLocalChange(schedule)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void syncNow() })
  window.addEventListener('online', () => void syncNow())
  window.addEventListener('offline', () => { if (state.user) set({ status: 'offline' }) })
}

/* ---------------- account actions ---------------- */

export async function sendEmailLink(email: string, redirectTo: string) {
  if (!supabase) throw new Error('Sign-in is not available in this build.')
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
  if (error) throw error
}

export async function signInWithGoogle(redirectTo: string) {
  if (!supabase) throw new Error('Sign-in is not available in this build.')
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  if (error) throw error
}

/** Signs out on this device. Local progress stays. */
export async function signOut() {
  clearTimeout(timer)
  await supabase?.auth.signOut({ scope: 'local' })
}

/** Deletes everything this user has on the server (doc, links, memberships, owned circles, activity), then signs out. */
export async function deleteServerData() {
  const uid = state.user?.id
  if (!supabase || !uid) return
  clearTimeout(timer)
  for (const [table, col] of [['user_data', 'user_id'], ['share_links', 'user_id'], ['circle_members', 'user_id'], ['circles', 'owner'], ['activity', 'user_id']] as const) {
    const { error } = await supabase.from(table).delete().eq(col, uid)
    if (error) throw error
  }
  await signOut() // otherwise the next sync would upload the local copy again
}
