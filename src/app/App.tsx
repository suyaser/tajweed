import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import type { Settings } from '../core/types'
import { Placeholder } from '../screens/_placeholders'
import { navigate, useRoute, type RouteName } from './router'
import { Shell } from './Shell'
import { Recovery, SaveErrorBanner } from './Recovery'
import { getLoadError, useData } from '../core/store'
import { startSync } from '../sync/sync'

// Optional account (spec §6): finish a returning sign-in link (?code=…) and start background sync. No-op without Supabase env.
void startSync()

/** Screen contract: src/screens/<Name>.tsx default-exports a component taking the route params. */
export type ScreenProps = { params: Record<string, string> }
const screens = import.meta.glob<{ default: ComponentType<ScreenProps> }>(['../screens/*.tsx', '!../screens/_*.tsx', '!../screens/*.test.tsx'], { eager: true })

const pascal = (n: RouteName) => n[0].toUpperCase() + n.slice(1)
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

  const Screen = screens[`../screens/${pascal(route.name)}.tsx`]?.default
  let body
  if (route.name === 'devComponents') body = <Placeholder name="NotFound" params={{}} />
  else if (Screen) body = <Screen params={route.params} />
  else body = <Placeholder name={pascal(route.name)} params={route.params} />

  return (
    <Shell route={route} theme={theme} textSize={textSize} tajweedPatterns={tajweedPatterns}>
      <SaveErrorBanner />
      {body}
    </Shell>
  )
}
