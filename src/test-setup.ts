// Tests run in English (the app defaults to Arabic); set before any test imports i18n.
localStorage.setItem('tajweed-path:lang', 'en')

// Tests see every Arabic dictionary and the content overlay (the app loads them only in Arabic: main.tsx).
import { loadArabic } from './i18n/arData'

await loadArabic()
