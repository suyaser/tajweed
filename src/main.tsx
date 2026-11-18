import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import { App } from './app/App'
import { useData } from './core/store'

function Root() {
  const { settings } = useData()
  return <App onboarded={!!settings.onboardedOn} theme={settings.theme} textSize={settings.textSize} tajweedPatterns={settings.tajweedPatterns} />
}

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
