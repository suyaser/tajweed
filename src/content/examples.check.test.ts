// Example checks (docs/15-example-strategy.md). Two modes:
//   npx vitest run src/content/examples.check.test.ts                      → the examples in content/rules.json
//   EXAMPLES_DIR=docs/examples npx vitest run src/content/examples.check.test.ts → proposal files <lessonId>.json there
//     (proposals replace that lesson's examples; every other lesson keeps its rules.json examples)
// Errors fail the test. Warnings are printed for a person to judge (REPORT=1 prints every example's analysis).
// @ts-expect-error -- no @types/node in this project; vitest runs in node from the repo root.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Example, ExampleRole, Verse } from '../core/types'
import { lessons } from './index'
import { courseLesson, courseOrder, unitOf } from './course'
import { alsoLessons, findTargets } from './rulemap'
import surahsJson from '../quran/surahs.json'

declare const process: { env: Record<string, string | undefined> }

export interface RawEx { verse: string; word_from: number; word_to: number; text: string; focus: string; stop?: boolean; note?: string; noteAr?: string }
export interface Proposal {
  lesson: string
  examples: (RawEx & { role: ExampleRole; why?: string; source?: string; contrast?: RawEx & { lesson: string; why?: string } })[]
  coverage?: string
  notes?: string
}

const ROLE_ORDER: ExampleRole[] = ['anchor', 'hear', 'say', 'notice', 'more']
const COUNTS: Record<ExampleRole, [number, number]> = { anchor: [1, 1], hear: [2, 2], say: [3, 3], notice: [0, 1], more: [0, 4] }
/** Lessons whose rule is about the stop itself: a stop flag and an ayah-final word are their point. */
const STOP_LESSONS = new Set(['arid', 'qal-k', 'waqf-signs', 'waqf-how', 'rawm-ishmam', 'sakt', 'iwad', 'lin', 'aqwa-maddayn'])
/** Rules learned in or about pause signs: a span across a sign is part of the lesson. */
const SIGN_LESSONS = new Set(['waqf-signs', 'waqf-how', 'sakt'])
/** Already-shared words that are deliberate (two different stop rules on one word). */
const SHARED_OK = new Set(['112:1:4:4'])

const cache = new Map<number, Verse[]>()
function verse(key: string): Verse | undefined {
  const [s, a] = key.split(':').map(Number)
  if (!(s >= 1 && s <= 114)) return undefined
  if (!cache.has(s)) cache.set(s, JSON.parse(readFileSync(`public/data/surah/${String(s).padStart(3, '0')}.json`, 'utf8')))
  return cache.get(s)![a - 1]
}
const isMark = (c: string) => /\p{Mn}/u.test(c)
const surahOf = (key: string) => Number(key.split(':')[0])
const NAMES: string[] = (surahsJson as [string, number][]).map(s => s[0])
/** Surah numbers a unit covers: "الناس، الفلق" lists names, "الكوثر ← الفيل" is a range; plus its finale's surah. */
const unitSurahs = (lessonId: string): number[] => {
  const u = unitOf(lessonId)
  if (!u) return []
  const n = (name: string) => NAMES.indexOf(name.trim()) + 1
  const out = new Set<number>(u.finale ? [surahOf(u.finale.from)] : [])
  for (const part of u.surahs.split('،')) {
    const [a, b] = part.split('←').map(n)
    if (a && b) for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.add(i)
    else if (a) out.add(a)
  }
  return [...out].sort((x, y) => x - y)
}

const toExample = (lessonId: string, e: RawEx & { role?: ExampleRole }, i: number | string): Example => ({
  id: `${lessonId}#${i}`, lessonId, role: e.role, verseKey: e.verse, wordFrom: e.word_from, wordTo: e.word_to, text: e.text, focus: e.focus, stopping: !!e.stop,
})

/** Checks one example against the Quran data. Returns [errors, warnings, info]. */
export function checkExample(lessonId: string, e: RawEx, label: string, everyone: Example[], role?: ExampleRole) {
  const errs: string[] = [], warns: string[] = [], info: string[] = []
  const v = verse(e.verse)
  if (!v) return [[`${label}: no ayah ${e.verse}`], warns, info] as const
  const words = v.words.slice(e.word_from - 1, e.word_to)
  if (e.word_from < 1 || e.word_to > v.words.length || e.word_from > e.word_to) errs.push(`${label}: words ${e.word_from}-${e.word_to} outside 1-${v.words.length}`)
  if (words.join(' ') !== e.text) errs.push(`${label}: text "${e.text}" ≠ Tanzil "${words.join(' ')}" (${e.verse} w${e.word_from}-${e.word_to})`)
  const k = e.text.indexOf(e.focus)
  if (!e.focus || k < 0) errs.push(`${label}: focus "${e.focus}" not in text`)
  else {
    const end = k + e.focus.length
    if (isMark(e.text[k])) errs.push(`${label}: focus starts on a mark`)
    if (end < e.text.length && isMark(e.text[end])) errs.push(`${label}: focus ends before its letter's mark "${e.text[end]}" (cuts a letter from its vowel)`)
    if (e.text.indexOf(e.focus, k + 1) >= 0) warns.push(`${label}: focus "${e.focus}" occurs twice in the text; the first is highlighted`)
  }
  const last = e.word_to === v.words.length
  const focusAtEnd = k >= 0 && k + e.focus.length >= e.text.replace(/[\s\p{Mn}]+$/u, '').length
  if (last && !e.stop && focusAtEnd && !STOP_LESSONS.has(lessonId))
    errs.push(`${label}: the focus is on the ayah's last letter but stop=false; the reciter stops there, so a joined reading is never heard`)
  if (last && !e.stop && !focusAtEnd) info.push(`${label}: ends the ayah (focus inside the word; stopping doesn't change it)`)
  if (e.stop && !last && !(v.marks ?? []).some(m => m.after === e.word_to)) warns.push(`${label}: stop=true but no ayah end or pause sign after word ${e.word_to}`)
  const signs = (v.marks ?? []).filter(m => m.after >= e.word_from && m.after < e.word_to)
  if (signs.length && !SIGN_LESSONS.has(lessonId)) warns.push(`${label}: spans the pause sign ${signs.map(m => m.mark).join(' ')} after word ${signs[0].after}; the reciter may stop there`)
  const ex = toExample(lessonId, e, label)
  const also = alsoLessons(ex, v, [])
  const at = courseOrder.indexOf(lessonId)
  const later = also.filter(id => courseOrder.indexOf(id) > at)
  if (later.length && (role === 'anchor' || role === 'hear' || role === 'say'))
    warns.push(`${label}: also shows rules not learned yet: ${later.join(', ')} (judge whether they change the sound the learner copies)`)
  if (also.length) info.push(`${label}: also ${also.join(', ')}${later.length ? ` (later: ${later.join(', ')})` : ''}`)
  const targets = findTargets(v, lessonId)
  const own = Array.from({ length: e.word_to - e.word_from + 1 }, (_, i) => e.word_from + i)
  if (lessonsDetectable.has(lessonId) && !alsoLessons({ ...ex, lessonId: '' }, v, []).includes(lessonId))
    warns.push(`${label}: the tajweed data does not see ${lessonId} in these words (data targets in this ayah: ${targets.join(',') || 'none'}); check the rule really applies`)
  for (const o of everyone)
    if (o.lessonId !== lessonId && o.verseKey === e.verse && o.wordFrom <= e.word_to && o.wordTo >= e.word_from && !SHARED_OK.has(`${e.verse}:${e.word_from}:${e.word_to}`))
      (role !== 'more' && o.role !== 'more' ? errs : warns).push(`${label}: same words as ${o.id} (${o.text}); a word should teach one lesson only`)
  // the same word (any ayah) as a core example of another lesson: legal, but the learner meets it as a repeat
  if (role && role !== 'more') {
    const same = everyone.filter(o => o.lessonId !== lessonId && o.role !== 'more' && o.text === e.text && o.verseKey !== e.verse)
    if (same.length) warns.push(`${label}: the same word "${e.text}" is a core example of ${[...new Set(same.map(o => o.lessonId))].join(', ')} too (another ayah); use a different word unless this one is clearly the best for both`)
  }
  info.push(`${label}: surah ${surahOf(e.verse)}${unitSurahs(lessonId).includes(surahOf(e.verse)) ? ' (this unit)' : ''}; words ${own.join(',')}`)
  return [errs, warns, info] as const
}

/** Lessons the data can detect: some example ayah of theirs in rules.json has a target. */
const lessonsDetectable = new Set(lessons.filter(l => l.examples.some(x => { const v = verse(x.verseKey); return v && findTargets(v, l.id).length })).map(l => l.id))

export function checkProposal(p: Proposal, everyone: Example[]) {
  const errs: string[] = [], warns: string[] = [], info: string[] = []
  const id = p.lesson
  if (!lessons.some(l => l.id === id)) errs.push(`${id}: unknown lesson`)
  const roles = p.examples.map(e => e.role)
  for (const r of ROLE_ORDER) {
    const n = roles.filter(x => x === r).length, [lo, hi] = COUNTS[r]
    if (n < lo || n > hi) (r === 'say' || r === 'hear' ? warns : errs).push(`${id}: ${n} "${r}" examples (expected ${lo}${hi > lo ? `–${hi}` : ''})`)
  }
  const sorted = [...roles].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))
  if (roles.join() !== sorted.join()) errs.push(`${id}: examples out of role order (${ROLE_ORDER.join(' → ')})`)
  const contrastWith = courseLesson(id).contrastWith
  const keys = new Set<string>()
  p.examples.forEach((e, i) => {
    const label = `${id}#${i + 1}(${e.role})`
    const key = `${e.verse}:${e.word_from}:${e.word_to}`
    if (keys.has(key)) errs.push(`${label}: repeats another example of this lesson`)
    keys.add(key)
    if (!e.note) warns.push(`${label}: no note (what to listen for)`)
    if (e.note && !e.noteAr) errs.push(`${label}: note without noteAr`)
    if (!e.why) warns.push(`${label}: no "why" (reason for the pick)`)
    const [a, b, c] = checkExample(id, e, label, everyone, e.role)
    errs.push(...a); warns.push(...b); info.push(...c)
    if (e.role === 'notice') {
      if (!contrastWith) errs.push(`${label}: notice example but the lesson has no contrastWith in course.json`)
      if (!e.contrast) errs.push(`${label}: notice example needs a contrast word`)
      else {
        if (e.contrast.lesson !== contrastWith) errs.push(`${label}: contrast lesson ${e.contrast.lesson} ≠ course contrastWith ${contrastWith}`)
        if (e.contrast.note && !e.contrast.noteAr) errs.push(`${label}: contrast note without noteAr`)
        const [ca, cb, cc] = checkExample(e.contrast.lesson, e.contrast, `${label} contrast`, [], undefined)
        errs.push(...ca); warns.push(...cb); info.push(...cc)
        const cv = verse(e.contrast.verse)
        if (cv && alsoLessons({ ...toExample('', e.contrast, 'c'), lessonId: '' }, cv, []).includes(id))
          errs.push(`${label}: the contrast word also shows ${id}; it must not have the rule being noticed`)
        if (courseOrder.indexOf(e.contrast.lesson) > courseOrder.indexOf(id)) errs.push(`${label}: contrast lesson is taught later`)
      }
    } else if (e.contrast) errs.push(`${label}: only the notice example has a contrast`)
  })
  if (contrastWith && !roles.includes('notice')) warns.push(`${id}: course.json gives contrastWith ${contrastWith} but no notice example`)
  const here = new Set(unitSurahs(id))
  const fromUnit = p.examples.filter(e => here.has(surahOf(e.verse)) && e.role !== 'more').length
  info.push(`${id}: ${fromUnit} of ${p.examples.filter(e => e.role !== 'more').length} core examples from this unit's surahs (${[...here].join(',') || '—'})`)
  return { errs, warns, info }
}

const dir = process.env.EXAMPLES_DIR
const proposals: Proposal[] = dir && existsSync(dir)
  ? readdirSync(dir).filter((f: string) => f.endsWith('.json')).flatMap((f: string) => {
      try { return [JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))] } catch { console.log(`skipped ${f}: not valid JSON (being written?)`); return [] }
    })
  : []
/** LESSONS=a,b: report only these lessons (every proposal still counts for the shared-word check). */
const only = process.env.LESSONS ? new Set(process.env.LESSONS.split(',')) : null

describe.skipIf(!existsSync('public/data/surah/001.json'))('examples', () => {
  const replaced = new Set(proposals.map(p => p.lesson))
  const everyone: Example[] = [
    ...lessons.filter(l => !replaced.has(l.id)).flatMap(l => l.examples),
    ...proposals.flatMap(p => p.examples.map((e, i) => toExample(p.lesson, e, i + 1))),
  ]
  const tagged = lessons.filter(l => l.examples.some(x => x.role))
  const targets: Proposal[] = dir ? proposals : tagged.map(l => ({ lesson: l.id, examples: [] }))

  it(dir ? `proposals in ${dir}` : 'role-tagged lessons in rules.json', () => {
    const all: string[] = [], warnings: string[] = []
    for (const p of (dir ? proposals : []).filter(p => !only || only.has(p.lesson))) {
      const { errs, warns, info } = checkProposal(p, everyone)
      all.push(...errs); warnings.push(...warns)
      if (process.env.REPORT) console.log(`\n== ${p.lesson}\n` + info.join('\n'))
    }
    if (!dir) for (const l of tagged) {
      const raw = JSON.parse(readFileSync('content/rules.json', 'utf8')).find((r: { id: string }) => r.id === l.id)
      const { errs, warns } = checkProposal({ lesson: l.id, examples: raw.examples.map((e: RawEx & { role: ExampleRole }) => ({ ...e, why: '-', noteAr: e.note ? '-' : undefined })) }, everyone)
      all.push(...errs); warnings.push(...warns.filter(w => !/no "why"|no note/.test(w)))
    }
    if (warnings.length) console.log(`\nWARNINGS (${warnings.length})\n` + warnings.join('\n'))
    expect(all, all.join('\n')).toEqual([])
    void targets
  })
})
