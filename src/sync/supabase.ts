// Optional backend (spec §6). Without the env values (or in unit tests) the app runs exactly as before: local only.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && key && import.meta.env.MODE !== 'test'
    ? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true } })
    : null

/** Where sign-in links return: the app's own page, no hash (the code arrives in the query string; the hash router is untouched). */
export const redirectUrl = () => location.origin + location.pathname

/** Last sign-in failure from a returning link (shown on the Account screen). */
export let authError: string | null = null
export const clearAuthError = () => { authError = null }

/** Finishes an email-link or Google sign-in: `?code=…` → session, then removes the query and keeps the hash. */
export async function exchangeCodeFromUrl(): Promise<void> {
  const q = new URLSearchParams(location.search)
  const code = q.get('code')
  const failed = q.get('error_description') ?? q.get('error')
  if (!code && !failed) return
  try {
    if (code && supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) authError = error.message
    } else if (failed) authError = failed
  } catch (e) {
    authError = (e as Error).message
  }
  history.replaceState(history.state, '', location.pathname + (location.hash || '#/account'))
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
