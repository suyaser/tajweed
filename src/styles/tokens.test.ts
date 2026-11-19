// @ts-expect-error -- no @types/node in this project; vitest runs in node. (?raw CSS imports are empty under vitest.)
import { readFileSync } from 'node:fs'

const css: string = readFileSync('src/styles/tokens.css', 'utf8')

// Design §3.2: every text and tajweed token ≥ 4.5:1 on --surface and --bg, both themes (WCAG 2.x).
const block = (sel: string) => {
  const body = css.slice(css.indexOf(sel)).split('}')[0]
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]))
}
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

const light = block(':root, .theme-light, .theme-dark {')
const dark = { ...light, ...block(':root[data-theme="dark"], .theme-dark {') }
const TEXT = ['--ink', '--muted', '--gold-ink', '--link', '--good', '--bad']

test.each([['light', light], ['dark', dark]] as const)('%s theme text and tajweed tokens reach 4.5:1', (_, t) => {
  const fails: string[] = []
  for (const k of Object.keys(t).filter((k) => k.startsWith('--t-') || TEXT.includes(k)))
    for (const bg of ['--surface', '--bg']) {
      const r = ratio(t[k], t[bg])
      if (r < 4.5) fails.push(`${k} on ${bg}: ${r.toFixed(2)}`)
    }
  expect(fails).toEqual([])
  expect(Object.keys(t).filter((k) => k.startsWith('--t-'))).toHaveLength(11)
})

test('on-green text on the band and rail', () => {
  expect(ratio(light['--on-green'], light['--green'])).toBeGreaterThanOrEqual(4.5)
  expect(ratio(dark['--on-green'], dark['--green'])).toBeGreaterThanOrEqual(4.5)
  expect(ratio(light['--gold-display'], light['--green'])).toBeGreaterThanOrEqual(4.5)
})
