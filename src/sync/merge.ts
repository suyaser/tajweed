// Pure merge of two UserData documents (spec §6). Generic on purpose: new top-level lists merge without code changes.
//  - arrays: union of items keyed by id ?? lessonId ?? unitId (plain values by value); same key → the newer
//    updatedAt ?? at ?? on wins (soft deletes carry deletedAt + a newer updatedAt, so they win too)
//  - objects with a timestamp (settings): the newer one wins whole
//  - objects without one (a DayLog, a phase): field by field, so marks from two devices on one day both survive
//  - numbers: the larger (schemaVersion, listenSeconds); other values: local's, unless local has none.
//    listenSeconds keeps the max, not the sum: merge runs again on every sync, so summing would add the same
//    minutes once per round trip; the max can only under-count time studied on two devices the same day.
// The caller still runs the result through the store's validation (importJson).

type J = any

const isObj = (x: unknown): x is Record<string, J> => !!x && typeof x === 'object' && !Array.isArray(x)
const stamp = (x: Record<string, J>): string | undefined => {
  const s = x.updatedAt ?? x.at ?? x.on
  return typeof s === 'string' ? s : undefined
}
const keyOf = (x: J): string => {
  const k = isObj(x) ? (x.id ?? x.lessonId ?? x.unitId) : undefined
  return k != null ? `k:${k}` : `v:${canonical(x)}`
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const norm = (x: J): J =>
  Array.isArray(x) ? x.map(v => JSON.stringify(norm(v)) ?? 'null').sort(cmp)
  : isObj(x) ? Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined).sort(([a], [b]) => cmp(a, b)).map(([k, v]) => [k, norm(v)]))
  : x
/**
 * Order-free JSON: sorted keys (jsonb reorders them) and sorted list items (two devices may hold the same rows in a
 * different order). Equal documents give equal strings.
 */
export const canonical = (x: J): string => JSON.stringify(norm(x)) ?? 'undefined'

/** Same document, ignoring the top-level updatedAt (it moves on every save). */
export const sameDoc = (a: J, b: J) => canonical({ ...a, updatedAt: 0 }) === canonical({ ...b, updatedAt: 0 })

function mergeArrays(a: J[], b: J[]): J[] {
  const out = new Map<string, J>()
  for (const x of a) out.set(keyOf(x), out.has(keyOf(x)) ? merge(out.get(keyOf(x)), x) : x)
  for (const x of b) {
    const k = keyOf(x)
    out.set(k, out.has(k) ? merge(out.get(k), x) : x)
  }
  return [...out.values()]
}

function mergeFields(a: Record<string, J>, b: Record<string, J>): Record<string, J> {
  const out: Record<string, J> = { ...a }
  for (const k of Object.keys(b)) out[k] = merge(a[k], b[k])
  return out
}

function merge(a: J, b: J): J {
  if (a === undefined || a === null) return b
  if (b === undefined || b === null) return a
  if (Array.isArray(a) && Array.isArray(b)) return mergeArrays(a, b)
  if (isObj(a) && isObj(b)) {
    const ta = stamp(a), tb = stamp(b)
    if (ta && tb && ta !== tb) return ta > tb ? a : b
    return mergeFields(a, b)
  }
  if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b)
  return a
}

/** local + remote → one document. Never drops a row either side has; idempotent: mergeData(m, m) equals m. */
export function mergeData(local: J, remote: J): J {
  if (!isObj(remote)) return local
  if (!isObj(local)) return remote
  const out = mergeFields(local, remote) // top level is never "newer wins whole", even though it has updatedAt
  const ua = [local.updatedAt, remote.updatedAt].filter((s): s is string => typeof s === 'string').sort()
  if (ua.length) out.updatedAt = ua[ua.length - 1]
  return out
}

/* ---------------- first sync of an account on this device ---------------- */

/** Anything worth keeping beyond settings: a lesson, an answer, a finale, a correction or a session. */
export const hasProgress = (d: J): boolean =>
  isObj(d) && ['introductions', 'attempts', 'finales', 'corrections', 'sessions'].some(k => Array.isArray(d[k]) && d[k].length > 0)

/**
 * What to do when `userId` syncs and this device last synced `lastAccount` (null: never).
 *  - 'merge': the usual merge (same account as last time, or nothing on the server yet and no one else's data here)
 *  - 'take-remote': this device holds no progress, so the account's copy is used as is (its settings too)
 *  - 'merge-account-settings': first sync with progress on both sides: merge rows, keep the account's settings
 *    (this device's settings are only its own onboarding; a newer stamp must not override the account's)
 *  - 'ask': another account synced here before and this device has progress: never mix two people's data silently
 */
export type FirstSync = 'merge' | 'take-remote' | 'merge-account-settings' | 'ask'
export function firstSync(local: J, remote: J, lastAccount: string | null, userId: string): FirstSync {
  if (lastAccount === userId) return 'merge'
  if (!hasProgress(local)) return isObj(remote) ? 'take-remote' : 'merge'
  if (lastAccount) return 'ask'
  return isObj(remote) ? 'merge-account-settings' : 'merge'
}

/** The document a first sync produces (before validation). 'ask' is resolved by the learner into 'take-remote' or 'merge-account-settings'. */
export function firstSyncDoc(plan: Exclude<FirstSync, 'ask'>, local: J, remote: J): J {
  if (plan === 'take-remote') return isObj(remote) ? remote : local
  const m = mergeData(local, remote)
  // An account copy that was never onboarded (a reset elsewhere) does not replace settings this device has set up.
  if (plan === 'merge-account-settings' && isObj(remote?.settings) && (remote.settings.onboardedOn || !local?.settings?.onboardedOn))
    m.settings = remote.settings
  return m
}
