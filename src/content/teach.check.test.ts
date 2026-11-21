// Teaching text checks (docs/16-teaching-strategy.md), and the glossary build:
//   npx vitest run src/content/teach.check.test.ts                      → check content/teach/*.json
//   UPDATE_GLOSSARY=1 npx vitest run src/content/teach.check.test.ts    → also rebuild content/glossary.json
//   LESSONS=a,b … → report only these lessons
// @ts-expect-error -- no @types/node in this project; vitest runs in node from the repo root.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { courseOrder } from './course'
import { REQUIRED_TERMS, fold, termsIn, type Teach, type TeachText, type Term } from './teach'
import stored from '../../content/glossary.json'

declare const process: { env: Record<string, string | undefined> }
const DIR = 'content/teach'
const files: Teach[] = existsSync(DIR)
  ? readdirSync(DIR).filter((f: string) => f.endsWith('.json')).flatMap((f: string) => {
      try { return [JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'))] } catch { console.log(`skipped ${f}: not valid JSON (being written?)`); return [] }
    })
  : []
const rules: { id: string; definition: string; conditions?: string[]; tip?: string; list?: string[][]; counts?: { note?: string } }[] = JSON.parse(readFileSync('content/rules.json', 'utf8'))
const ar = JSON.parse(readFileSync('content/ar.json', 'utf8'))
const only = process.env.LESSONS ? new Set(process.env.LESSONS.split(',')) : null
const order = (id: string) => courseOrder.indexOf(id)

/** Every string of a teaching text, in reading order. */
const strings = (t: TeachText) => [t.plain, t.fits, ...t.how, t.why, t.spot ?? '', ...t.mistakes.flatMap(m => [m.wrong, m.right])]
/** The lesson's rule card, English and Arabic (it is shown under the teaching text as the summary). */
function cardStrings(id: string): string[] {
  const r = rules.find(x => x.id === id)!
  const a = ar.lessons[id] ?? {}
  return [r.definition, ...(r.conditions ?? []), r.tip ?? '', ...(r.list ?? []).flat(), r.counts?.note ?? '',
    a.definition ?? '', ...(a.conditions ?? []), a.tip ?? '', ...(a.list ?? []).flat(), a.countsNote ?? '']
}

function build() {
  const errs: string[] = []
  const entries: (Term & { lesson: string })[] = []
  for (const t of [...files].sort((a, b) => order(a.lesson) - order(b.lesson)))
    for (const term of t.terms) {
      const dup = entries.find(e => fold(e.term) === fold(term.term))
      if (dup) errs.push(`${t.lesson}: term ${term.term} is already defined by ${dup.lesson}; define it once, in the lesson that teaches it`)
      else entries.push({ ...term, lesson: t.lesson })
    }
  return { entries, errs }
}

it('teaching texts', () => {
  const { entries, errs } = build()
  const warns: string[] = []
  if (process.env.UPDATE_GLOSSARY) writeFileSync('content/glossary.json', JSON.stringify(entries, null, 1) + '\n')
  for (const t of files) {
    const id = t.lesson
    if (only && !only.has(id)) continue
    if (order(id) < 0) { errs.push(`${id}: not a course lesson`); continue }
    for (const lang of ['en', 'ar'] as const) {
      const x = t[lang]
      if (!x) { errs.push(`${id}.${lang}: missing`); continue }
      for (const k of ['plain', 'fits', 'why'] as const) if (!x[k]?.trim()) errs.push(`${id}.${lang}.${k}: empty`)
      if (!x.how?.length) errs.push(`${id}.${lang}.how: no steps`)
      if (!Array.isArray(x.mistakes)) errs.push(`${id}.${lang}.mistakes: missing`)
      else if (x.mistakes.length > 4) errs.push(`${id}.${lang}.mistakes: ${x.mistakes.length} pairs; at most 4`)
      if (x.spot === undefined) errs.push(`${id}.${lang}.spot: missing (null when the muṣḥaf shows no sign)`)
      if (x.plain && x.plain.length > 320) warns.push(`${id}.${lang}.plain: ${x.plain.length} chars; keep "in plain words" to 1–2 sentences`)
      for (const s of x.how ?? []) if (s.length > 320) warns.push(`${id}.${lang}.how: a step of ${s.length} chars; split it`)
      const total = strings(x).join('').length
      if (total > 2600) warns.push(`${id}.${lang}: ${total} chars in all; a beginner reads short blocks`)
    }
    if (t.en && t.ar && t.en.how?.length !== t.ar.how?.length) errs.push(`${id}: ${t.en.how?.length} English steps, ${t.ar.how?.length} Arabic`)
    if (t.en && t.ar && t.en.mistakes?.length !== t.ar.mistakes?.length) errs.push(`${id}: mistake counts differ between English and Arabic`)
    if (t.en && t.ar && (t.en.spot === null) !== (t.ar.spot === null)) errs.push(`${id}: spot is null in one language only`)
    for (const term of t.terms ?? []) {
      for (const k of ['term', 'say', 'en', 'ar'] as const) if (!term[k]?.trim()) errs.push(`${id}: term ${term.term ?? '?'} has no ${k}`)
      if (t.ar && !termsIn(strings(t.ar).join(' '), [term]).length) warns.push(`${id}: defines ${term.term} but its Arabic text never uses it`)
    }
    // a term in the teaching text must be taught here or earlier; the card may look ahead (Learn shows its meaning)
    for (const lang of ['en', 'ar'] as const) {
      if (!t[lang]) continue
      for (const e of termsIn(strings(t[lang]).join(' '), entries) as (Term & { lesson: string })[])
        if (order(e.lesson) > order(id)) errs.push(`${id}.${lang}: uses ${e.term} before its lesson (${e.lesson}); explain it in other words, or say it comes later`)
    }
    for (const e of termsIn(cardStrings(id).join(' '), entries) as (Term & { lesson: string })[])
      if (order(e.lesson) > order(id)) warns.push(`${id} card: uses ${e.term} before its lesson (${e.lesson}); Learn shows its meaning`)
  }
  const defined = new Set(entries.map(e => fold(e.term)))
  const missing = REQUIRED_TERMS.filter(r => !defined.has(fold(r)) && !entries.some(e => (e.forms ?? []).some(f => fold(f) === fold(r))))
  const complete = courseOrder.every(id => files.some(f => f.lesson === id))
  if (missing.length) (complete ? errs : warns).push(`terms no lesson explains yet: ${missing.join('، ')}`)
  if (!complete) warns.push(`lessons without a teaching text: ${courseOrder.filter(id => !files.some(f => f.lesson === id)).join(', ')}`)
  if (warns.length) console.log(`\nWARNINGS (${warns.length})\n` + warns.join('\n'))
  if (!process.env.UPDATE_GLOSSARY) expect(stored, 'content/glossary.json is stale: run with UPDATE_GLOSSARY=1').toEqual(entries)
  expect(errs, errs.join('\n')).toEqual([])
})

it('term matching: prefixes and endings count, other words and "not" phrases do not', () => {
  const ghunnah = { term: 'غنة', say: '', en: '', ar: '' }
  expect(termsIn('بغنةٍ من الخيشوم', [ghunnah])).toHaveLength(1)
  expect(termsIn('والغنة', [ghunnah])).toHaveLength(1)
  const madd = { term: 'مد', say: '', en: '', ar: '' }
  expect(termsIn('محمد', [madd])).toHaveLength(0)
  const rawm = { term: 'روم', say: '', en: '', ar: '', not: ['سورة الروم'] }
  expect(termsIn('في سورة الروم', [rawm])).toHaveLength(0)
  expect(termsIn('بالروم', [rawm])).toHaveLength(1)
})
