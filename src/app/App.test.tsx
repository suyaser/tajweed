import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { App, pascal, screenFor } from './App'
import { ROUTES, type RouteName } from './router'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
window.scrollTo = () => {}

const files = Object.keys(import.meta.glob(['../screens/*.tsx', '!../screens/_*.tsx', '!../screens/*.test.tsx']))
const routed = (Object.keys(ROUTES) as RouteName[]).filter((n) => files.includes(`../screens/${pascal(n)}.tsx`))

test('every screen file is routed, and every route with a screen file gets it', () => {
  expect(routed.length).toBeGreaterThanOrEqual(19)
  expect(routed.length).toBe(files.length)
  for (const n of routed) expect(screenFor(n), n).toBeDefined()
})

// Render each routed screen far enough to know it is not the Placeholder ("Not built yet."). Lazy screens resolve first.
test.each(routed.filter((n) => n !== 'onboarding'))('#/%s renders its screen, not the Placeholder', async (n) => {
  location.hash = '#/' + ROUTES[n as keyof typeof ROUTES].replace(/:(\w+)/g, (_, p) => (p === 'lessonId' ? 'izhar' : p === 'unitId' ? 'u1' : p === 'range' ? '1:1-1:7' : 'x'))
  const el = document.createElement('div')
  const root = createRoot(el)
  await act(async () => { root.render(<App />) })
  for (let i = 0; i < 50 && !el.querySelector('main')?.textContent; i++) await act(() => new Promise((r) => setTimeout(r, 20)))
  expect(el.textContent).not.toContain('Not built yet.')
  expect(el.querySelector('main')?.textContent?.length).toBeGreaterThan(0)
  act(() => root.unmount())
})
