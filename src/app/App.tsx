import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import type { Settings } from '../core/types'
import { Placeholder } from '../screens/_placeholders'
import { navigate, useRoute, type RouteName } from './router'
import { Shell } from './Shell'

/** Screen contract: src/screens/<Name>.tsx default-exports a component taking the route params. */
export type ScreenProps = { params: Record<string, string> }
const screens = import.meta.glob<{ default: ComponentType<ScreenProps> }>(['../screens/*.tsx', '!../screens/_*.tsx', '!../screens/*.test.tsx'], { eager: true })

const pascal = (n: RouteName) => n[0].toUpperCase() + n.slice(1)
const DevGallery = import.meta.env.DEV ? lazy(() => import('./DevGallery')) : null

export interface AppProps {
  /** false → every route redirects to #/onboarding (wire to settings.onboardedOn). */
  onboarded?: boolean
  theme?: Settings['theme']
  textSize?: Settings['textSize']
  tajweedPatterns?: boolean
}

export function App({ onboarded = true, theme = 'system', textSize = 'm', tajweedPatterns = false }: AppProps) {
  const route = useRoute()
  const redirect = !onboarded && route.name !== 'onboarding' && route.name !== 'devComponents'
  useEffect(() => {
    if (redirect) navigate('onboarding', { replace: true })
  }, [redirect])
  if (redirect) return null

  const Screen = screens[`../screens/${pascal(route.name)}.tsx`]?.default
  let body
  if (route.name === 'devComponents') body = DevGallery ? <Suspense fallback={null}><DevGallery /></Suspense> : <Placeholder name="NotFound" params={{}} />
  else if (Screen) body = <Screen params={route.params} />
  else body = <Placeholder name={pascal(route.name)} params={route.params} />

  return (
    <Shell route={route} theme={theme} textSize={textSize} tajweedPatterns={tajweedPatterns}>
      {body}
    </Shell>
  )
}
