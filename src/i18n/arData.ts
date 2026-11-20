// The Arabic dictionaries (src/i18n/ar/*.json) and the content overlay (content/ar.json) are loaded only for the
// Arabic UI: main.tsx awaits loadArabic() before it imports the app, since the language is fixed per load (i18n).
export const AR: Record<string, string> = {}
export const arContent: { data?: unknown } = {}

export async function loadArabic() {
  const files = import.meta.glob<Record<string, string>>('./ar/*.json', { import: 'default' })
  const [dicts, content] = await Promise.all([Promise.all(Object.values(files).map((f) => f())), import('../../content/ar.json')])
  Object.assign(AR, ...dicts)
  arContent.data = content.default
}
