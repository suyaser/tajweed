import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import type { Settings } from '../core/types'
import { Placeholder } from '../screens/_placeholders'
import { navigate, useRoute, type RouteName } from './router'
import { Shell } from './Shell'
import { Recovery, SaveErrorBanner } from './Recovery'
import { getLoadError, useData } from '../core/store'
import { startSync } from '../sync/sync'
import { Page } from '../components/kit'

// Optional account (spec §6): finish a returning sign-in link (?code=…) and start background sync. No-op without Supabase env.
void startSync()

/** Screen contract: src/screens/<Name>.tsx default-exports a component taking the route params. */
export type ScreenProps = { params: Record<string, string> }
/** Screens without their own <Page>, and the width they read best at. */
const PAGE_WIDTH: Partial<Record<RouteName, 'narrow' | 'default' | 'wide'>> = {
  today: 'wide', plan: 'wide', progress: 'wide', unit: 'default', guide: 'default', onboarding: 'narrow', learn: 'narrow', review: 'narrow', notFound: 'default',
}

// Every src/screens/<Name>.tsx is a route's screen. The rarely used ones load on first visit (their own chunk).
type Mod = { default: ComponentType<ScreenProps> }
const eager = import.meta.glob<Mod>(['../screens/*.tsx', '!../screens/_*.tsx', '!../screens/*.test.tsx',
  '!../screens/{Session,Circle,CircleView,Account,Shared,Resources,Guide}.tsx'], { eager: true })
const later = import.meta.glob<Mod>('../screens/{Session,Circle,CircleView,Account,Shared,Resources,Guide}.tsx')
const screens: Record<string, ComponentType<ScreenProps>> = {
  ...Object.fromEntries(Object.entries(eager).map(([k, m]) => [k, m.default])),
  ...Object.fromEntries(Object.entries(later).map(([k, load]) => [k, lazy(load)])),
}

export const pascal = (n: RouteName) => n[0].toUpperCase() + n.slice(1)
/** The screen component for a route (undefined: no screen file yet, App shows the Placeholder). */
export const screenFor = (n: RouteName): ComponentType<ScreenProps> | undefined => screens[`../screens/${pascal(n)}.tsx`]
const DevGallery = import.meta.env.DEV ? lazy(() => import('./DevGallery')) : null

/** The app wired to the store. Unreadable data shows Recovery before the onboarding gate (M5): never a fresh welcome. */
export function Root() {
  const { settings } = useData()
  const loadError = getLoadError()
  if (loadError) return <Recovery message={loadError.message} />
  return <App onboarded={!!settings.onboardedOn} theme={settings.theme} textSize={settings.textSize} tajweedPatterns={settings.tajweedPatterns} />
}

export interface AppProps {
  /** false → every route redirects to #/onboarding (wire to settings.onboardedOn). */
  onboarded?: boolean
  theme?: Settings['theme']
  textSize?: Settings['textSize']
  tajweedPatterns?: boolean
}

export function App({ onboarded = true, theme = 'system', textSize = 'm', tajweedPatterns = false }: AppProps) {
  const route = useRoute()
  const redirect = !onboarded && route.name !== 'onboarding' && route.name !== 'devComponents' && route.name !== 'shared' // a teacher opens #/shared/… with no app data
  useEffect(() => {
    if (redirect) navigate('onboarding', { replace: true })
  }, [redirect])
  if (redirect) return null

  // Dev gallery: no shell; the page embeds four frames (one language × theme each).
  if (route.name === 'devComponents' && DevGallery) return <Suspense fallback={null}><DevGallery frame={!!route.params.frame} /></Suspense>

  const Screen = screenFor(route.name)
  let body
  if (route.name === 'devComponents') body = <Placeholder name="NotFound" params={{}} />
  else if (Screen) body = <Screen params={route.params} />
  else body = <Placeholder name={pascal(route.name)} params={route.params} />
  // Screens that don't lay out their own page get the shared Page (gutters, max width, rhythm).
  const width = PAGE_WIDTH[route.name]
  if (Screen && width) body = <Page width={width}>{body}</Page>

  return (
    <Shell route={route} theme={theme} textSize={textSize} tajweedPatterns={tajweedPatterns}>
      <SaveErrorBanner />
      <Suspense fallback={null}>{body}</Suspense>
    </Shell>
  )
}
