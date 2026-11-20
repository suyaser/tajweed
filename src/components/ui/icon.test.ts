// index.html asks Google Fonts for only the icons the app uses (&icon_names=…). Every icon name in the code must be
// in that list, or it renders as its ligature text. Sorted, as Google requires.
// @ts-expect-error -- no @types/node in this project; vitest runs in node.
import { readFileSync } from 'node:fs'

const html: string = readFileSync('index.html', 'utf8')
const listed = html.match(/icon_names=([a-z0-9_,]+)/)?.[1].split(',') ?? []

const sources = import.meta.glob<string>(['../../**/*.{ts,tsx}', '!../../**/*.test.{ts,tsx}'], { query: '?raw', import: 'default', eager: true })

/** Icon names in code: <Icon name="x"> / name={a ? 'x' : 'y'}, icon="x" / icon: 'x' / icon={…}, and *_ICON(S) maps. */
export function iconNames(src: string): string[] {
  const out: string[] = []
  const quoted = (s: string) => [...s.replace(/[!=]==\s*['"][^'"]*['"]/g, '').matchAll(/['"]([a-z][a-z0-9_]+)['"]/g)].map((m) => m[1])
  for (const m of src.matchAll(/<Icon\b[^>]*?\bname=(?:"([^"]+)"|\{((?:[^{}]|\{[^{}]*\})*)\})/g)) out.push(...(m[1] ? [m[1]] : quoted(m[2])))
  for (const m of src.matchAll(/\bicon\??\s*(?:=|:)\s*(?:"([^"]+)"|'([^']+)'|\{((?:[^{}]|\{[^{}]*\})*)\})/g)) out.push(...(m[1] || m[2] ? [m[1] || m[2]] : quoted(m[3])))
  for (const m of src.matchAll(/[A-Z_]*ICONS?\b[^=\n]*=\s*[{[]([^}\]]*)[}\]]/g)) out.push(...quoted(m[1]))
  return out.filter((n) => /^[a-z][a-z0-9_]*$/.test(n))
}

test('extracts names (sanity)', () => {
  expect(iconNames(`<Icon name="lock" /> <Icon name={on ? 'pause' : 'play_arrow'} /> <Icon name={s === 'done' ? 'check' : X} /> icon="star" icon: 'help'`))
    .toEqual(['lock', 'pause', 'play_arrow', 'check', 'star', 'help'])
})

test('index.html requests every icon the code uses, sorted', () => {
  expect(listed.length).toBeGreaterThan(50)
  expect([...listed].sort()).toEqual(listed)
  const used = new Set(Object.values(sources).flatMap(iconNames))
  expect([...used].filter((n) => !listed.includes(n)).sort()).toEqual([])
})
