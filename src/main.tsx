import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Direction } from 'radix-ui'
import './styles/app.css'
import { lang, loadArabic } from './i18n'

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

// The language is fixed per load: the Arabic dictionaries and content overlay load first (only in Arabic), then the
// app, whose modules read them as they are evaluated.
async function start() {
  if (lang === 'ar') await loadArabic()
  const [{ Root }, { ErrorBoundary }] = await Promise.all([import('./app/App'), import('./app/Recovery')])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Direction.Provider dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <ErrorBoundary>
          <Root />
        </ErrorBoundary>
      </Direction.Provider>
    </StrictMode>,
  )
}
void start()
