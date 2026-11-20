import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import { Root } from './app/App'
import { ErrorBoundary } from './app/Recovery'
import { lang } from './i18n'

document.documentElement.lang = lang
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'

// A new version waits until the learner is on Today, so a deploy never reloads a class, a recording or a note (m2).
const onToday = () => /^(#\/?(today)?)?$/.test(location.hash)
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    const apply = () => { if (onToday()) updateSW(true) }
    apply()
    window.addEventListener('hashchange', apply)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)
