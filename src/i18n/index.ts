// UI language (English / Arabic). Chosen once per device and applied at startup: switching reloads the app,
// so every module (content adapter, dates, strings) reads one fixed language. No runtime re-render plumbing.
export type Lang = 'en' | 'ar'
const KEY = 'tajweed-path:lang'

function initial(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'en' || v === 'ar') return v
  } catch { /* storage blocked */ }
  return typeof navigator !== 'undefined' && /^ar\b/i.test(navigator.language ?? '') ? 'ar' : 'en'
}

export const lang: Lang = initial()
export const isAr = lang === 'ar'
/** Has the learner picked a language yet (onboarding asks once)? */
export const langChosen = (() => { try { return !!localStorage.getItem(KEY) } catch { return true } })()

export function setLang(l: Lang, reload = true) {
  try { localStorage.setItem(KEY, l) } catch { /* storage blocked: this visit only */ }
  if (reload) location.reload()
}

// Arabic strings live in src/i18n/ar/*.json, keyed by the exact English text (one file per area, merged here).
const files = import.meta.glob<Record<string, string>>('./ar/*.json', { eager: true, import: 'default' })
export const AR: Record<string, string> = Object.assign({}, ...Object.values(files))

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
export const digits = (s: string | number) => (isAr ? String(s).replace(/\d/g, d => AR_DIGITS[+d]) : String(s))

/**
 * Translate a UI string. `en` is the English text and the dictionary key; `{name}` placeholders are filled from
 * `vars` (numbers get Arabic-Indic digits in Arabic). Missing translations fall back to English.
 */
export function t(en: string, vars?: Record<string, string | number>): string {
  let s = isAr ? AR[en] ?? en : en
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(typeof v === 'number' ? digits(v) : v)
  return s
}

/** Pick between an English and an Arabic value (content fields that carry both). */
export const pick = <T,>(en: T, ar: T | undefined | null): T => (isAr && ar != null && ar !== '' ? ar : en)

/** Locale for Intl (dates, plurals). */
export const locale = isAr ? 'ar' : 'en-GB'
