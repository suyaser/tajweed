import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as S from '../core/store'
import { Root } from './App'
import { ErrorBoundary, SaveErrorBanner } from './Recovery'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const roots: (() => void)[] = []
const render = (ui: React.ReactNode) => {
  const el = document.createElement('div')
  const r = createRoot(el)
  act(() => r.render(ui))
  roots.push(() => act(() => r.unmount()))
  return el
}
afterEach(() => { roots.splice(0).forEach(u => u()); vi.restoreAllMocks(); localStorage.clear(); S.reload() })

describe('recovery', () => {
  it('unreadable data shows recovery, not onboarding (M5)', () => {
    localStorage.setItem(S.STORAGE_KEY, '{"schemaVersion":42}')
    S.reload()
    location.hash = '#/today'
    const el = render(<Root />)
    expect(el.textContent).toContain('could not be read')
    expect(el.textContent).toContain('Download my data')
    expect(location.hash).toBe('#/today')
  })

  it('a render crash shows recovery with a download and reload (M4)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Boom = () => { throw new Error('boom') }
    const el = render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(el.textContent).toContain('Download my data')
    expect(el.textContent).toContain('Reload')
  })

  it('shows the storage-full banner while saves fail (M3)', () => {
    const el = render(<SaveErrorBanner />)
    expect(el.textContent).toBe('')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
    act(() => S.updateSettings({ wirdTime: '07:00' }))
    expect(el.textContent).toContain("Couldn't save — storage is full.")
  })
})
