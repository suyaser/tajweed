// Pure merge of two UserData documents (spec §6). Generic on purpose: new top-level lists merge without code changes.
//  - arrays: union of items keyed by id ?? lessonId ?? unitId (plain values by value); same key → the newer
//    updatedAt ?? at ?? on wins (soft deletes carry deletedAt + a newer updatedAt, so they win too)
//  - objects with a timestamp (settings): the newer one wins whole
//  - objects without one (a DayLog, a phase): field by field, so marks from two devices on one day both survive
//  - numbers: the larger (schemaVersion, listenSeconds); other values: local's, unless local has none
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
