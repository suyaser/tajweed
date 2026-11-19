import { useSyncExternalStore } from 'react'

// Hash router (spec §5, design §4.4). Patterns are tried in order: literal segments before :params.
export const ROUTES = {
  onboarding: 'onboarding',
  today: 'today',
  learn: 'learn/:lessonId',
  review: 'review',
  listen: 'listen/:range',
  rules: 'rules',
  rule: 'rules/:lessonId',
  resources: 'resources',
  teacher: 'teacher',
  teacherNew: 'teacher/new',
  session: 'teacher/:id',
  plan: 'plan',
  progress: 'progress',
  settings: 'settings',
  guide: 'guide',
  // R2, reserved
  mushaf: 'mushaf/:surah',
  mutun: 'mutun/:matnId',
  drill: 'drill/:pairId',
  // dev only
  devComponents: 'dev/components',
} as const

export type RouteName = keyof typeof ROUTES | 'notFound'
/** Path params plus hash query (`#/teacher/4?sheet=1` → { id: '4', sheet: '1' }). */
export interface Route { name: RouteName; params: Record<string, string>; path: string }

const TABLE = (Object.entries(ROUTES) as [RouteName, string][])
  .map(([name, p]) => ({ name, segs: p.split('/') }))
  .sort((a, b) => b.segs.filter((s) => !s.startsWith(':')).length - a.segs.filter((s) => !s.startsWith(':')).length)

const decode = (s: string) => {
  try { return decodeURIComponent(s) } catch { return s }
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [pathPart, query = ''] = raw.split('?')
  const path = pathPart.replace(/\/+$/, '') || 'today'
  const segs = path.split('/')
  const q = Object.fromEntries(new URLSearchParams(query))
  for (const r of TABLE) {
    if (r.segs.length !== segs.length) continue
    const params: Record<string, string> = { ...q }
    let ok = true
    r.segs.forEach((s, i) => {
      if (s.startsWith(':')) params[s.slice(1)] = decode(segs[i])
      else if (s !== segs[i]) ok = false
    })
    if (ok) return { name: r.name, params, path }
  }
  return { name: 'notFound', params: {}, path }
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const snapshot = () => window.location.hash

export function useRoute(): Route {
  return parseHash(useSyncExternalStore(subscribe, snapshot, () => ''))
}

/** `href('rules', 'ikhfa')` → '#/rules/ikhfa'; also accepts a full path 'rules/ikhfa'. */
export const href = (...parts: (string | number)[]) => '#/' + parts.map((p) => encodeURIComponent(String(p)).replace(/%2F/g, '/')).join('/')

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  // Keep a `?query` part as written: only the path segments are encoded.
  const [p, q] = path.replace(/^#?\/?/, '').split('?')
  const h = path.startsWith('#') ? path : href(p) + (q ? '?' + q : '')
  if (opts.replace) {
    history.replaceState(null, '', h)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else window.location.hash = h
}
