// @ts-expect-error -- no @types/node in this project; vitest runs in node. (?raw CSS imports are empty under vitest.)
import { readFileSync } from 'node:fs'

const app: string = readFileSync('src/styles/app.css', 'utf8')
const tajweed: string = readFileSync('src/styles/tokens.css', 'utf8')

// The colour roles in app.css: @theme (light), then the dark override block (`@variant dark {`).
const vars = (body: string) => Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1].replace(/^--color-/, ''), m[2]]))
const section = (css: string, from: string) => css.slice(css.indexOf(from)).split(/\n\s*\}/)[0]
const light = { ...vars(section(app, '@theme {')), ...vars(section(tajweed, ':root {')) }
const dark = { ...light, ...vars(section(app, '@variant dark {')), ...vars(section(tajweed, ':root[data-theme="dark"] {')) }

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

// Text roles (and the muṣḥaf palette) on the page canvas and on cards.
const TEXT = ['on-surface', 'on-surface-variant', 'primary', 'secondary', 'error', 'success', 'focus-ink', 'on-primary-container']
const BGS = ['background', 'surface', 'surface-container-lowest']

test.each([['light', light], ['dark', dark]] as const)('%s theme: text tokens reach 4.5:1 on background and surface', (_, t) => {
  const fails: string[] = []
  for (const k of [...TEXT, ...Object.keys(t).filter((k) => k.startsWith('--t-'))])
    for (const bg of BGS) {
      const r = ratio(t[k], t[bg])
      if (r < 4.5) fails.push(`${k} on ${bg}: ${r.toFixed(2)}`)
    }
  expect(fails).toEqual([])
  expect(Object.keys(t).filter((k) => k.startsWith('--t-'))).toHaveLength(11)
})

test.each([['light', light], ['dark', dark]] as const)('%s theme: text on fills', (_, t) => {
  expect(ratio(t['on-primary'], t['primary-fill'])).toBeGreaterThanOrEqual(4.5)
  expect(ratio(t['on-primary-container'], t['primary-container'])).toBeGreaterThanOrEqual(4.5)
  expect(ratio(t['on-secondary-container'], t['secondary-container'])).toBeGreaterThanOrEqual(4.5)
  expect(ratio(t['focus-ink'], t['focus-bg'])).toBeGreaterThanOrEqual(4.5)
  expect(ratio(t['primary'], t['primary-container'])).toBeGreaterThanOrEqual(4.5) // active tab label on its pill
})

test('dark primary text differs from the dark fill', () => {
  expect(dark.primary).not.toBe(dark['primary-fill'])
  expect(light.primary).toBe('#115e57')
})
