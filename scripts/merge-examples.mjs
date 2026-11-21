#!/usr/bin/env node
// Writes reviewed example proposals (docs/15-example-strategy.md §5) into content/rules.json and content/ar.json.
// Usage: node scripts/merge-examples.mjs [docs/examples/proposals]
// Each <lessonId>.json replaces that lesson's examples; Arabic notes go to ar.json lessons[id].exampleNotes
// (keys "1", "2"… and "4c" for a notice example's contrast word). The proposals stay as the record of why.
import fs from 'node:fs'

const dir = process.argv[2] ?? 'docs/examples/proposals'
const rules = JSON.parse(fs.readFileSync('content/rules.json', 'utf8'))
const course = JSON.parse(fs.readFileSync('content/course.json', 'utf8'))
const ar = JSON.parse(fs.readFileSync('content/ar.json', 'utf8'))
const ex = ({ verse, word_from, word_to, text, focus, stop, note }) => ({ verse, word_from, word_to, text, focus, stop: !!stop, ...(note ? { note } : {}) })

let n = 0
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const p = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'))
  const r = rules.find(x => x.id === p.lesson)
  if (!r) throw new Error(`${f}: no lesson ${p.lesson}`)
  const notes = {}
  r.examples = p.examples.map((e, i) => {
    if (e.noteAr) notes[String(i + 1)] = e.noteAr
    if (e.contrast?.noteAr) notes[`${i + 1}c`] = e.contrast.noteAr
    return { ...ex(e), role: e.role, ...(e.contrast ? { contrast: { lesson: e.contrast.lesson, ...ex(e.contrast) } } : {}) }
  })
  if (p.noticeText) { // the Hear step's "what to listen for", which names the examples
    course.lessons[p.lesson] = { ...course.lessons[p.lesson], notice: p.noticeText.en }
    ar.course[p.lesson] = { ...ar.course[p.lesson], notice: p.noticeText.ar }
  }
  ar.lessons[p.lesson] ??= {}
  if (Object.keys(notes).length) ar.lessons[p.lesson].exampleNotes = notes
  else delete ar.lessons[p.lesson].exampleNotes
  n++
}
// both files are written with a one-space indent (their existing format)
fs.writeFileSync('content/rules.json', JSON.stringify(rules, null, 1) + '\n')
fs.writeFileSync('content/ar.json', JSON.stringify(ar, null, 1) + '\n')
fs.writeFileSync('content/course.json', JSON.stringify(course, null, 1) + '\n')
console.log(`merged ${n} lessons; now run: UPDATE_ALSO=1 npx vitest run src/content/also.test.ts && npx vitest run`)
