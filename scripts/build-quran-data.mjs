// Builds public/data/surah/NNN.json (Verse[]), public/data/meta.json and src/quran/surahs.json.
// Raw downloads are cached in .cache/. Needs Node >= 22.18 (imports src/quran/data.ts with type stripping) and `unzip`.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { RECITERS, stripBasmala } from '../src/quran/data.ts'

const SRC = {
  text: 'https://github.com/cpfair/quran-tajweed/files/7281388/quran-uthmani.txt',
  tajweed: 'https://raw.githubusercontent.com/cpfair/quran-tajweed/master/output/tajweed.hafs.uthmani-pause-sajdah.json',
  align: 'https://github.com/cpfair/quran-align/releases/download/release-2016-11-24/quran-align-data-2016-11-24.zip',
  metadata: 'https://tanzil.net/res/text/metadata/quran-data.xml',
  // Same Tanzil Uthmani text with pause (waqf/sakt) and sajdah marks. Tanzil only serves the current version (1.1),
  // so only the mark positions are taken from it, mapped onto the words of the pinned 1.0.2 text (decision log #10).
  pause: 'https://tanzil.net/pub/download/index.php?marks=true&sajdah=true&quranType=uthmani&outType=txt-2&agree=true',
}
// quran-align timing file per reciter. Husary_64kbps and Husary_128kbps are the same recording
// (2:282 is 260.07 s vs 259.98 s), so the 64k timings drive the 128k files.
const ALIGN = { 'husary-muallim': 'Husary_Muallim_128kbps', husary: 'Husary_64kbps', minshawy: 'Minshawy_Murattal_128kbps' }

const CACHE = '.cache'
mkdirSync(CACHE, { recursive: true })
const fetched = {}
async function get(name, url) {
  const path = `${CACHE}/${name}`
  if (!existsSync(path)) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${url}: ${res.status}`)
    writeFileSync(path, Buffer.from(await res.arrayBuffer()))
    console.log('downloaded', url)
  }
  fetched[name] = { url, fetchedOn: statSync(path).mtime.toISOString().slice(0, 10) }
  return path
}

const textPath = await get('quran-uthmani.txt', SRC.text)
const tajweedPath = await get('tajweed.json', SRC.tajweed)
const zipPath = await get('align.zip', SRC.align)
const metaPath = await get('quran-data.xml', SRC.metadata)
const pausePath = await get('quran-uthmani-pause-sajdah.txt', SRC.pause)
if (!existsSync(`${CACHE}/align`)) execFileSync('unzip', ['-oq', zipPath, '-d', `${CACHE}/align`])

// Text: "s|a|text" lines, CRLF, followed by the Tanzil licence block (#-comments).
const text = new Map()
for (const line of readFileSync(textPath, 'utf8').split(/\r?\n/)) {
  const m = /^(\d+)\|(\d+)\|(.*)$/.exec(line)
  if (m) text.set(`${m[1]}:${m[2]}`, m[3])
}
const pauseText = new Map()
for (const line of readFileSync(pausePath, 'utf8').split(/\r?\n/)) {
  const m = /^(\d+)\|(\d+)\|(.*)$/.exec(line)
  if (m) pauseText.set(`${m[1]}:${m[2]}`, m[3])
}
const pauseVersion = /Uthmani, Version ([\d.]+)/i.exec(readFileSync(pausePath, 'utf8'))?.[1]
if (pauseText.size !== 6236) throw new Error(`pause-marked text has ${pauseText.size} ayat`)

// A token made only of these is a pause mark: ۖ ۗ ۘ ۙ ۚ ۛ ۜ and the sajdah ۩.
const MARK_TOKEN = /^[\u06D6-\u06DC\u06E9]+$/u
// Letter skeleton for checking that a 1.1 word is the same word as in 1.0.2 (1.1 changed ٱلْءَاخِرَةِ → ٱلْـَٔاخِرَةِ etc.).
const skel = (w) => w.normalize('NFD').replace(/[^\u0621-\u063a\u0641-\u064a\u0671]/g, '').replace(/[ءاأإآٱؤئىي]/g, '')
/** Pause marks of `marked` (1.1) as {after: 1-based word in `words` (1.0.2), mark}. Throws if the words don't line up. */
function pauseMarks(key, marked, words) {
  const toks = marked.split(' ')
  const newWords = toks.filter((t) => !MARK_TOKEN.test(t))
  // 1.1 word index → 1.0.2 word count so far. 1.1 splits بَعْدَمَا into بَعْدَ مَا (2:181, 8:6, 13:37): walk skeletons.
  const at = []
  let i = 0, acc = ''
  for (const w of newWords) {
    acc += skel(w)
    if (acc === skel(words[i] ?? '')) { i++; acc = ''; at.push(i) }
    else if (skel(words[i] ?? '').startsWith(acc)) at.push(null) // inside a word that 1.0.2 writes joined
    else throw new Error(`${key}: pause-marked text does not line up at "${w}"`)
  }
  if (i !== words.length) throw new Error(`${key}: pause-marked text has ${i}/${words.length} words`)
  const out = []
  let seen = 0
  for (const t of toks) {
    if (!MARK_TOKEN.test(t)) { seen++; continue }
    const after = at[seen - 1]
    if (!after) throw new Error(`${key}: mark ${t} not after a whole word`)
    for (const mark of t) out.push({ after, mark })
  }
  return out
}

const tanzilNotice = readFileSync(textPath, 'utf8').split(/\r?\n/).filter((l) => l.startsWith('#')).join('\n')
if (text.size !== 6236) throw new Error(`text has ${text.size} ayat`)

const tajweed = new Map(JSON.parse(readFileSync(tajweedPath, 'utf8')).map((r) => [`${r.surah}:${r.ayah}`, r.annotations]))

// Tanzil metadata spellings → the muṣḥaf (Madinah) surah titles.
const NAME_FIX = { 14: 'إبراهيم', 34: 'سبأ', 76: 'الإنسان', 78: 'النبأ', 82: 'الانفطار', 84: 'الانشقاق' }
const surahs = [...readFileSync(metaPath, 'utf8').matchAll(/<sura index="(\d+)" ayas="(\d+)"[^>]* name="([^"]+)"/g)].map((m) => ({ n: +m[1], nameAr: NAME_FIX[m[1]] ?? m[3], ayahs: +m[2] }))
if (surahs.length !== 114) throw new Error('metadata: expected 114 surahs')

const timings = {}
for (const [id, file] of Object.entries(ALIGN)) {
  timings[id] = new Map(JSON.parse(readFileSync(`${CACHE}/align/${file}.json`, 'utf8')).map((r) => [`${r.surah}:${r.ayah}`, r.segments]))
}

const report = { ayat: 0, spans: 0, spansDropped: 0, spanOutOfRange: 0, pauseMarks: {} }
for (const id in timings) report[id] = { missingAyat: 0, wordIndexMismatch: 0, repairedMuqattaat: 0, untimedWords: 0, ayatWithUntimedWords: 0 }
const untimedList = Object.fromEntries(Object.keys(ALIGN).map((id) => [id, []]))

mkdirSync('public/data/surah', { recursive: true })
for (const { n, ayahs } of surahs) {
  const verses = []
  for (let a = 1; a <= ayahs; a++) {
    const key = `${n}:${a}`
    const raw = (tajweed.get(key) ?? []).map(({ rule, start, end }) => ({ rule, start, end, src: 'cpfair' }))
    const { text: t, tajweed: spans } = stripBasmala(n, a, text.get(key), raw)
    report.spansDropped += raw.length - spans.length
    const len = Array.from(t).length
    for (const s of spans) if (s.start < 0 || s.end > len || s.start >= s.end) report.spanOutOfRange++
    report.spans += spans.length
    const words = t.split(' ')
    const verse = { verseKey: key, text: t, words, tajweed: spans, timings: {} }
    // Marks are found on the full ayah, then shifted past the removed basmala words.
    const full = text.get(key).split(' ')
    const cut = full.length - words.length
    const marks = pauseMarks(key, pauseText.get(key), full).map((m) => ({ ...m, after: m.after - cut }))
    if (marks.some((m) => m.after < 1)) throw new Error(`${key}: pause mark inside the basmala`)
    for (const m of marks) report.pauseMarks[m.mark] = (report.pauseMarks[m.mark] ?? 0) + 1
    if (marks.length) verse.marks = marks
    for (const id in timings) {
      let segs = timings[id].get(key)
      const r = report[id]
      if (!segs) { r.missingAyat++; continue }
      const valid = (ss) => ss.every(([w0, w1]) => w0 >= 0 && w1 <= words.length && w0 < w1)
      if (!valid(segs)) {
        r.wordIndexMismatch++
        // quran-align splits muqattaʿat (الٓر) into letters, so later indices overflow by k.
        // Word 0 keeps its segment; the rest shift back by k. Seen only in 10:1–15:1.
        const k = Math.max(...segs.map((x) => x[1])) - words.length
        const fixed = [segs[0], ...segs.slice(1).map(([w0, w1, s, e]) => [w0 - k, w1 - k, s, e])]
        if (segs[0][0] === 0 && segs[0][1] === 1 && fixed.slice(1).every(([w0]) => w0 >= 1) && valid(fixed)) { segs = fixed; r.repairedMuqattaat++ }
        else { console.warn(`${id} ${key}: bad word indices, timings dropped`); continue }
      }
      const timed = new Set(segs.flatMap(([w0, w1]) => Array.from({ length: w1 - w0 }, (_, i) => w0 + i)))
      for (let w = 0; w < words.length; w++) if (!timed.has(w)) untimedList[id].push(`${key}:${w + 1}`)
      const untimed = words.length - timed.size
      r.untimedWords += untimed
      if (untimed) r.ayatWithUntimedWords++
      // quran-align: 0-based start, exclusive end → 1-based inclusive [wordFrom, wordTo].
      verse.timings[id] = segs.map(([w0, w1, s, e]) => [w0 + 1, w1, s, e])
    }
    verses.push(verse)
    report.ayat++
  }
  writeFileSync(`public/data/surah/${String(n).padStart(3, '0')}.json`, JSON.stringify(verses))
}

const builtOn = new Date().toISOString().slice(0, 10)
writeFileSync('public/data/meta.json', JSON.stringify({
  surahs,
  reciters: RECITERS.map((r) => ({ ...r, timingsFrom: `quran-align ${ALIGN[r.id]}.json` })),
  sources: [
    { name: 'Tanzil Quran Text (Uthmani 1.0.2), copy pinned by cpfair/quran-tajweed', url: 'https://tanzil.net', licence: 'Verbatim copies only; credit and link to tanzil.net', notice: tanzilNotice },
    { name: `Tanzil Quran Text (Uthmani ${pauseVersion}, with pause and sajdah marks): mark positions only`, url: 'https://tanzil.net', licence: 'Verbatim copies only; credit and link to tanzil.net' },
    { name: 'Tanzil Quran metadata (surah names, ayah counts)', url: 'https://tanzil.net', licence: 'CC BY' },
    { name: 'Collin Fair, quran-tajweed', url: 'https://github.com/cpfair/quran-tajweed', licence: 'CC BY 4.0' },
    { name: 'Collin Fair, quran-align (release 2016-11-24)', url: 'https://github.com/cpfair/quran-align', licence: 'CC BY 4.0' },
    { name: 'Ayah audio: everyayah.com', url: 'https://everyayah.com', licence: 'No published terms' },
  ],
  untimedWords: untimedList, // 'surah:ayah:word' (1-based) per reciter: play the whole ayah instead (spec U2)
  edits: 'Basmala removed from ayah 1 of surahs 2–114 except 9 (tajweed offsets shifted); text otherwise verbatim. ' +
    'Pause and sajdah marks are kept apart in Verse.marks (word they follow), not inserted into the text. ' +
    `Surah names ${Object.keys(NAME_FIX).join(', ')} respelled as in the muṣḥaf.`,
  builtFrom: Object.values(fetched),
  builtOn,
}))
writeFileSync('src/quran/surahs.json', JSON.stringify(surahs.map((s) => [s.nameAr, s.ayahs])))

console.log(JSON.stringify(report, null, 1))
const bad = report.spanOutOfRange + Object.keys(ALIGN).reduce((n, id) => n + report[id].missingAyat + report[id].wordIndexMismatch - report[id].repairedMuqattaat, 0)
if (report.ayat !== 6236 || bad) { console.error('verification failed'); process.exit(1) }
