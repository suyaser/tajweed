// content/ar.json must cover every translatable English field (no gaps), with the same shape (fact option counts).
import rules from '../../content/rules.json'
import course from '../../content/course.json'
import rawPairs from '../../content/pairs.json'
import rawMutun from '../../content/mutun.json'
import { AR_CONTENT as A, topics } from './index'

interface R {
  id: string; definition: string; tip?: string; counts?: { note?: string }; conditions?: string[]; list?: string[][]
  examples?: { note?: string; contrast?: { note?: string } }[]; facts?: { options: string[] }[]
}

test('every lesson field has Arabic, same shape', () => {
  for (const r of rules as R[]) {
    const a = A.lessons[r.id]
    expect(a?.definition, r.id).toBeTruthy()
    expect(a?.nameEn, r.id).toBeTruthy()
    expect(!!a?.tip, `${r.id} tip`).toBe(!!r.tip)
    expect(!!a?.countsNote, `${r.id} countsNote`).toBe(!!r.counts?.note)
    expect(a?.conditions?.length ?? 0, `${r.id} conditions`).toBe(r.conditions?.length ?? 0)
    expect(a?.list?.map(l => l.length) ?? [], `${r.id} list`).toEqual(r.list?.map(l => l.length) ?? [])
    const notes = (r.examples ?? []).flatMap((e, i) => [...(e.note ? [String(i + 1)] : []), ...(e.contrast?.note ? [`${i + 1}c`] : [])]) // "7c": a notice example's contrast word
    expect(Object.keys(a?.exampleNotes ?? {}).sort(), `${r.id} exampleNotes`).toEqual(notes.sort())
    expect(a?.facts?.map(f => (f.q && f.why ? f.options.length : -1)) ?? [], `${r.id} facts`).toEqual(r.facts?.map(f => f.options.length) ?? [])
  }
})

test('topics, units, notices, pairs and mutun have Arabic', () => {
  for (const t of topics) expect(A.topics[t.id]?.intro, t.id).toBeTruthy()
  for (const u of course.units) {
    expect(A.units[u.id]?.name && A.units[u.id]?.intro, u.id).toBeTruthy()
    expect(A.units[u.id]?.mutun?.length ?? 0, `${u.id} mutun`).toBe(u.mutun?.length ?? 0)
  }
  for (const [id, l] of Object.entries(course.lessons)) if (l.notice) expect(A.course[id]?.notice, id).toBeTruthy()
  for (const p of rawPairs) expect(A.pairs[`${p.a}~${p.b}`], `${p.a}~${p.b}`).toBeTruthy()
  for (const l of rawMutun.lines) if (l.gloss) expect(A.mutun[`${l.text}-${l.n}`], `${l.text}-${l.n}`).toBeTruthy()
})
