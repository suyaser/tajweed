// Closing passages and unit finales in content/course.json are computed here from the ayah-level lesson detection
// (src/content/rulemap.ts). Regenerate with `UPDATE_COURSE=1 npx vitest run src/content/course.build.test.ts`;
// without it the test fails when course.json has drifted from the data (spec 09 §2).
// @ts-expect-error -- no @types/node in this project; vitest runs in node from the repo root.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Verse } from '../core/types'
import { lessons, mutun } from './index'
import { alsoLessons, lessonsInAyah } from './rulemap'
import stored from '../../content/course.json'

declare const process: { env: Record<string, string | undefined> }

interface Range { from: string; to: string }
interface Unit { id: string; n: number; surahs: string; lessons: string[]; finale: (Range & { label: string }) | null; mutun: { matn: string; from: number; to: number; note: string }[] }
interface Course { units: Unit[]; lessons: Record<string, { closing: Range | null; closingOverride?: Range; contrastWith: string | null; notice: string | null }> }

const course = stored as unknown as Course
const order = course.units.flatMap(u => u.lessons)
const idx = new Map(order.map((id, i) => [id, i]))
const meta: { surahs: { n: number; nameAr: string; ayahs: number }[] } = JSON.parse(readFileSync('public/data/meta.json', 'utf8'))
const nameOf = (s: number) => meta.surahs[s - 1].nameAr
const AR = (n: number) => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d])
const unitSurahs = (u: Unit) => new Set(u.surahs.split('، ').map(n => meta.surahs.find(s => s.nameAr === n)?.n).filter(Boolean) as number[])

const UNGATED = new Set(['dad-zha'])
// What cpfair marks in every ayah that has it (checked over all 6236): همزة الوصل after the first letter, نّ مّ after
// the first letter, a قلقلة letter with سكون, ۟, and ۢ or ٓ before the end.
const CPFAIR_TEXT = /(?<=.)\u0671|(?<=.)[نم]\u0651|[قطبجد]\u0652|\u06DF|\u06E2(?=.)|\u0653(?=.)/

interface Ayah { s: number; a: number; max: number; counts: Map<string, number> }

function loadAyahs(): Ayah[][] {
  return meta.surahs.map(({ n }) => {
    const vs: Verse[] = JSON.parse(readFileSync(`public/data/surah/${String(n).padStart(3, '0')}.json`, 'utf8'))
    return vs.map((v, i) => {
      const counts = new Map<string, number>()
      v.words.forEach((w, k) => {
        const ex = { id: '', lessonId: '', verseKey: v.verseKey, wordFrom: k + 1, wordTo: k + 1, text: w, focus: '', stopping: k === v.words.length - 1 }
        for (const id of alsoLessons(ex, v, [])) counts.set(id, (counts.get(id) ?? 0) + 1)
      })
      const found = lessonsInAyah(v).filter(id => idx.has(id))
      for (const id of [...counts.keys()]) if (!found.includes(id)) counts.delete(id)
      for (const id of found) if (!counts.has(id)) counts.set(id, 1) // shown across words only (e.g. إظهار)
      // ض/ظ are in almost every passage from الفاتحة on, like ر: they don't gate a passage, only show `dad-zha`.
      const gate = found.filter(id => !UNGATED.has(id))
      // An ayah with no cpfair spans is a data gap if its text has something cpfair marks everywhere else; its rules
      // can't be checked, so it is never in a passage. (The 63 such ayahs in 2026-11 have none: they are genuinely
      // uncoloured, e.g. 93:3 مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ, and the text detection covers the rest.)
      const gap = !v.tajweed.length && CPFAIR_TEXT.test(v.text)
      return { s: n, a: i + 1, max: gap ? Infinity : Math.max(-1, ...gate.map(id => idx.get(id)!)), counts }
    })
  })
}

interface Cand { s: number; from: number; to: number; whole: boolean; max: number; ayahs: Ayah[] }

function candidates(all: Ayah[][], finaleSurahs: Set<number>): Cand[] {
  const out: Cand[] = []
  for (const ayahs of all) {
    const s = ayahs[0].s, n = ayahs.length
    for (let i = 0; i < n; i++) {
      let max = -1
      for (let j = i; j < n && j - i < 12; j++) {
        max = Math.max(max, ayahs[j].max)
        out.push({ s, from: i + 1, to: j + 1, whole: i === 0 && j === n - 1, max, ayahs: ayahs.slice(i, j + 1) })
      }
    }
    if (n > 12 && finaleSurahs.has(s)) out.push({ s, from: 1, to: n, whole: true, max: Math.max(...ayahs.map(a => a.max)), ayahs })
  }
  return out
}

const count = (c: Cand, ids: string[]) => c.ayahs.reduce((t, a) => t + ids.reduce((u, id) => u + (a.counts.get(id) ?? 0), 0), 0)
const tier = (c: Cand, unit: Set<number>) => (unit.has(c.s) ? 0 : c.s === 1 || c.s >= 78 ? 1 : 2)

/**
 * `closing`: whole surah > passage; the unit's surahs, then جزء عمّ and الفاتحة, then the rest; more of `ids`; shorter.
 * `place` (a closing that can't show its lesson, a finale with no whole unit surah): the unit's surahs first (any place
 * when the unit has none), then more of `ids`, whole surah, shorter. `finale` (whole unit surahs): more of `ids`, longer.
 */
function best(cs: Cand[], unit: Set<number>, ids: string[], mode: 'closing' | 'place' | 'finale' = 'closing'): Cand | undefined {
  const len = (c: Cand) => c.to - c.from
  const key = (c: Cand) => [
    ...(mode === 'closing' ? [c.whole ? 0 : 1, tier(c, unit), -count(c, ids), len(c)]
      : mode === 'place' ? [unit.size ? tier(c, unit) : 0, -count(c, ids), c.whole ? 0 : 1, len(c)]
      : [-count(c, ids), -len(c)]),
    c.s, c.from,
  ]
  const less = (a: number[], b: number[]) => { const i = a.findIndex((v, j) => v !== b[j]); return i >= 0 && a[i] < b[i] }
  let top: Cand | undefined, topKey: number[] = []
  for (const c of cs) {
    const k = key(c)
    if (!top || less(k, topKey)) [top, topKey] = [c, k]
  }
  return top
}

const range = (c: Cand | undefined): Range | null => (c ? { from: `${c.s}:${c.from}`, to: `${c.s}:${c.to}` } : null)

function build(): { closings: Record<string, Range | null>; finales: Record<string, Unit['finale']>; shows: Record<string, boolean>; all: Ayah[][] } {
  const all = loadAyahs()
  const detectable = new Set(all.flat().flatMap(a => [...a.counts.keys()]))
  const cands = candidates(all, new Set(course.units.flatMap(u => [...unitSurahs(u)])))
  const closings: Record<string, Range | null> = {}, shows: Record<string, boolean> = {}
  for (const u of course.units) {
    const us = unitSurahs(u)
    for (const id of u.lessons) {
      const k = idx.get(id)!
      const fixed = course.lessons[id].closingOverride
      if (fixed) { closings[id] = fixed; shows[id] = true; continue } // hand-picked: checked below
      // One ayah only when no longer passage shows the lesson (a surah of one ayah has none longer).
      const covered = cands.filter(c => c.max <= k && c.to - c.from < 12)
      const multi = covered.filter(c => c.to > c.from || c.whole)
      const showing = detectable.has(id) ? covered.filter(c => count(c, [id]) > 0) : []
      const showingMulti = showing.filter(c => multi.includes(c))
      shows[id] = showing.length > 0
      closings[id] = range(showingMulti.length ? best(showingMulti, us, [id]) : showing.length ? best(showing, us, [id])
        : best(multi, us, [id], 'place'))
    }
  }
  const finales: Record<string, Unit['finale']> = {}
  let k = -1
  for (const u of course.units) {
    k += u.lessons.length
    const us = unitSurahs(u)
    const covered = cands.filter(c => c.max <= k && (c.to > c.from || c.whole))
    const pool = covered.filter(c => c.whole && us.has(c.s))
    const c = pool.length ? best(pool, us, u.lessons, 'finale') : best(covered.filter(c => c.to - c.from < 12), us, u.lessons, 'place')
    finales[u.id] = c ? { ...range(c)!, label: c.whole ? nameOf(c.s) : `${nameOf(c.s)} ${AR(c.from)}–${AR(c.to)}` } : null
  }
  return { closings, finales, shows, all }
}

describe.skipIf(!existsSync('public/data/surah/001.json'))('course.json closing passages and finales', () => {
  it('match the data (run with UPDATE_COURSE=1 to regenerate)', () => {
    const { closings, finales, shows } = build()
    if (process.env.UPDATE_COURSE) {
      const next = structuredClone(course)
      for (const u of next.units) u.finale = finales[u.id]
      for (const id of order) next.lessons[id].closing = closings[id]
      writeFileSync('content/course.json', JSON.stringify(next, null, 1) + '\n')
      console.log(order.map(id => `${id} → ${closings[id] ? `${closings[id]!.from}–${closings[id]!.to}${shows[id] ? '' : ' (not shown)'}` : 'null'}`).join('\n'))
      console.log(course.units.map(u => `${u.id} finale → ${finales[u.id]?.label ?? 'null'}`).join('\n'))
    } else {
      expect(Object.fromEntries(order.map(id => [id, course.lessons[id].closing]))).toEqual(closings)
      expect(Object.fromEntries(course.units.map(u => [u.id, u.finale]))).toEqual(finales)
    }
    expect(finales.u7).toEqual({ from: '1:1', to: '1:7', label: 'الفاتحة' })
  })

  it('takes a hand-picked closingOverride only when every ayah in it uses learned rules', () => {
    const { all } = build()
    for (const id of order) {
      const o = course.lessons[id].closingOverride
      if (!o) continue
      expect(course.lessons[id].closing, id).toEqual(o)
      const [[s, a], [s2, b]] = [o.from, o.to].map(k => k.split(':').map(Number))
      expect(s2, id).toBe(s)
      for (let n = a; n <= b; n++) expect(all[s - 1][n - 1].max, `${id} ${s}:${n}`).toBeLessThanOrEqual(idx.get(id)!)
    }
  })
})

describe('course.json', () => {
  const byId = new Map(lessons.map(l => [l.id, l]))
  it('lists every lesson once, all in rules.json', () => {
    expect(new Set(order).size).toBe(order.length)
    expect([...order].sort()).toEqual(lessons.map(l => l.id).sort())
    expect(Object.keys(course.lessons).sort()).toEqual([...order].sort())
  })
  it('has a notice for every lesson, and contrasts with an earlier lesson that has examples', () => {
    for (const id of order) {
      const { notice, contrastWith } = course.lessons[id]
      expect(notice, id).toBeTruthy()
      if (!contrastWith) continue
      expect(idx.get(contrastWith)!, id).toBeLessThan(idx.get(id)!)
      expect(byId.get(id)!.examples.length, id).toBeGreaterThan(0)
      expect(byId.get(contrastWith)!.examples.length, id).toBeGreaterThan(0)
    }
  })
  it('places every mutun line in exactly one unit', () => {
    const seen = new Map<string, string>()
    for (const u of course.units)
      for (const m of u.mutun) {
        expect(m.note, u.id).toBeTruthy()
        for (let n = m.from; n <= m.to; n++) {
          expect(seen.get(`${m.matn}-${n}`), `${m.matn} ${n}`).toBeUndefined()
          seen.set(`${m.matn}-${n}`, u.id)
        }
      }
    expect([...seen.keys()].sort()).toEqual(mutun.map(l => `${l.matn}-${l.n}`).sort())
  })
})
