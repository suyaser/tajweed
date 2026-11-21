// Parity fixtures for the Flutter app (docs/19 §2.8): runs the web's logic on fixed inputs and writes the inputs and
// outputs to mobile/test/fixtures/*.json. mobile/test/parity_test.dart runs the Dart port on the same inputs and must
// produce the same outputs, so the two implementations can't drift. Without UPDATE_FIXTURES this test fails when the
// committed fixtures no longer match the web; regenerate with `UPDATE_FIXTURES=1 npx vitest run src/parity.test.ts`,
// then make the Dart side pass.
// @ts-expect-error -- no @types/node in this project; vitest runs in node from the repo root.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { vi } from 'vitest'
import type { Attempt, Correction, Introduction, UserData } from './core/types'
declare const process: { env: Record<string, string | undefined> }

const DIR = 'mobile/test/fixtures'
const LANG_KEY = 'tajweed-path:lang'

/** Fresh modules in one language (the web fixes the language per load). */
async function inLang(lang: 'en' | 'ar') {
  localStorage.setItem(LANG_KEY, lang)
  vi.resetModules()
  const arData = await import('./i18n/arData')
  await arData.loadArabic()
  const mods = {
    i18n: await import('./i18n'),
    content: await import('./content'),
    course: await import('./content/course'),
    teach: await import('./content/teach'),
    questions: await import('./core/questions'),
    bidi: await import('./components/bidi'),
    studyI18n: await import('./screens/study/i18n'),
  }
  localStorage.setItem(LANG_KEY, 'en')
  return mods
}

function check(name: string, data: unknown) {
  const file = `${DIR}/${name}.json`
  const text = JSON.stringify(data) + '\n' // one line: these files are compared, not read
  if (process.env.UPDATE_FIXTURES) {
    mkdirSync(DIR, { recursive: true })
    writeFileSync(file, text)
  } else {
    expect(existsSync(file), `${file} missing: run UPDATE_FIXTURES=1 npx vitest run src/parity.test.ts`).toBe(true)
    expect(JSON.parse(readFileSync(file, 'utf8')), `${file} is stale: run UPDATE_FIXTURES=1 npx vitest run src/parity.test.ts, then fix the Dart side`).toEqual(JSON.parse(text))
  }
}

/* ---------------- content (both languages) ---------------- */

test.each(['en', 'ar'] as const)('content adapter (%s)', async (lang) => {
  const { content, course, teach } = await inLang(lang)
  const words = ['غنة', 'الغُنَّةُ', 'سورة الروم', 'بالإدغام', 'مدّ لازم', 'حروف الحلق والجوف']
  check(`content.${lang}`, {
    topics: content.topics, pairs: content.pairs, mutun: content.mutun, lessons: content.lessons, units: course.units,
    courseOrder: course.courseOrder,
    courseLessons: Object.fromEntries(course.courseOrder.map((id) => [id, course.courseLesson(id)])),
    drills: Object.fromEntries(content.lessons.map((l) => [l.id, content.drillFor(l)])),
    unitMutun: Object.fromEntries(course.units.map((u) => [u.id, course.unitMutun(u).map((m) => m.id)])),
    folds: words.map((w) => [w, teach.fold(w)]),
    terms: words.map((w) => [w, teach.termsIn(w).map((t) => t.term)]),
  })
}, 30000)

/* ---------------- i18n (both languages) ---------------- */

const TN = [
  ['{n} lesson', '{n} lessons'], ['{n} day studied this week', '{n} days studied this week'], ['{n} days ago', '{n} days ago'],
  ['Play the word to continue.', 'Play all {n} words to continue.'], ['{n} step left: {x}', '{n} steps left: {x}'],
  ['{n} reviews are waiting', '{n} reviews are waiting'], ['{n} week', '{n} weeks'], ['Show {n} more', 'Show {n} more'],
]
const NS = [0, 1, 2, 3, 7, 10, 11, 15, 99, 100, 101, 102, 103, 111, 1000]

test.each(['en', 'ar'] as const)('i18n and bidi (%s)', async (lang) => {
  const { i18n, content, bidi, studyI18n } = await inLang(lang)
  // real mixed strings: every lesson's definition, tip, conditions and example notes, plus the hard cases
  const texts = [
    ...content.lessons.flatMap((l) => [l.summary, l.tip, ...(l.conditions ?? []), ...l.examples.map((e) => e.note)]),
    'فتحة َ and a شدة (ّ)', 'رَبِّ', 'Exception: مَنْ ۜ رَاقٍ (75:27) has a سكت', 'أَرْجِهْ (7:111، 26:36)', 'ٱدْعُ (16:125) ← اُدْعُ',
    'الألوان من quran-tajweed بترخيص CC BY 4.0. تحقّق', 'افتح Quran.com', 'episodes of م. علاء حامد.', 'Recite الفاتحة ١–٧ ›',
  ].filter((s): s is string => !!s)
  check(`i18n.${lang}`, {
    tn: TN.flatMap(([one, other]) => NS.map((n) => [one, other, n, studyI18n.tn(one, other, n, { x: 'X' })])),
    t: [['{n} days', { n: 12 }], ['Which rule is the highlighted part?', {}], ['Lesson {n} of {m}', { n: 3, m: 58 }]].map(([k, v]) => [k, v, i18n.t(k as string, v as Record<string, number>)]),
    digits: [i18n.digits('2:5'), i18n.digits(114), i18n.SEP],
    bidi: texts.map((s) => ({
      s, carry: bidi.carryMarks(s), refs: bidi.arRefs(s), arabicLine: bidi.isArabicLine(s),
      bidi: bidi.splitBidi(s).map((p) => [p.text, p.ar]), latin: bidi.splitLatin(s).map((p) => [p.text, p.latin]),
    })),
  })
}, 30000)

/* ---------------- day ---------------- */

test('day', async () => {
  const day = await import('./core/day')
  const local: [number, number, number, number, number][] = [[2026, 2, 10, 2, 59], [2026, 2, 10, 3, 0], [2026, 0, 1, 1, 0], [2024, 1, 29, 23, 59], [2024, 2, 1, 0, 30], [2025, 11, 31, 2, 0]]
  const days = ['2024-02-28', '2024-12-31', '2025-03-29', '2026-03-10', '2026-10-25']
  check('day', {
    today: local.map((a) => [a, day.today(new Date(a[0], a[1], a[2], a[3], a[4]))]), // [y, month0, d, h, min]
    addDays: days.flatMap((d) => [-400, -1, 0, 1, 2, 30, 365].map((n) => [d, n, day.addDays(d, n)])),
    diffDays: days.flatMap((a) => days.map((b) => [a, b, day.diffDays(a, b)])),
    weekDays: days.flatMap((d) => [6, 0].map((w) => [d, w, day.weekDays(d, w)])),
  })
})

/* ---------------- scheduler, course, questions: a simulated learner ---------------- */

/** A deterministic history: lessons in course order, answers and corrections drawn from a seeded rng. */
async function simulate(seed: number, daysToRun: number, skip: number[]) {
  const { seeded } = await import('./core/questions')
  const { addDays } = await import('./core/day')
  const { courseOrder, units } = await import('./content/course')
  const rng = seeded(seed)
  const introductions: Introduction[] = []
  const attempts: Attempt[] = []
  const corrections: Correction[] = []
  const finales: UserData['finales'] = []
  let day = '2026-01-03'
  let n = 0
  for (let i = 0; i < daysToRun; i++, day = addDays(day, 1)) {
    if (skip.includes(i)) continue
    const at = (h: number, m: number) => `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`
    for (let k = 0; k < 2 && rng() < 0.7 && n < courseOrder.length; k++) introductions.push({ lessonId: courseOrder[n++], on: day, at: at(8, k) })
    for (const u of units) if (u.lessonIds.every((id) => introductions.some((x) => x.lessonId === id)) && !finales.some((f) => f.unitId === u.id) && rng() < 0.5) finales.push({ unitId: u.id, on: day })
    const known = introductions.map((x) => x.lessonId)
    for (let k = 0; k < 6 && known.length; k++) {
      const refId = known[Math.floor(rng() * known.length)]
      attempts.push({ id: `a${attempts.length}`, itemId: null, refId, kind: 'lesson', on: day, at: at(9, k), source: rng() < 0.1 ? 'learn' : 'review', exampleId: `${refId}#${1 + Math.floor(rng() * 3)}`, correct: rng() < 0.8, countsForSchedule: rng() < 0.95 })
    }
    if (rng() < 0.15 && known.length) {
      const id = `c${corrections.length}`
      corrections.push({ id, createdAt: at(10, 0), updatedAt: at(10, 0), deletedAt: rng() < 0.1 ? at(10, 5) : null, on: day, sessionId: null, verseKey: '1:2', severity: rng() < 0.4 ? 'jali' : 'khafi', lessonIds: [known[Math.floor(rng() * known.length)], 'not-introduced-yet'].slice(0, 1 + Math.floor(rng() * 2)), status: 'open', by: 'teacher' })
    }
    for (const c of corrections) if (!c.deletedAt && c.status === 'open' && rng() < 0.1) {
      const correct = rng() < 0.5
      attempts.push({ id: `a${attempts.length}`, itemId: `correction:${c.id}`, refId: c.id, kind: 'correction', on: day, at: at(11, 0), source: 'teacher', correct, countsForSchedule: true })
      if (correct) c.status = 'resolved'
    }
  }
  return { introductions, attempts, corrections, finales, last: addDays(day, -1) }
}

test('scheduler and course', async () => {
  const S = await import('./core/scheduler')
  const C = await import('./core/course')
  const { units } = await import('./content/course')
  const scenarios = []
  for (const [seed, len, skip] of [[1, 20, []], [7, 70, [30, 31, 32, 33, 34, 35, 36, 37, 38, 39]], [42, 140, [60, 61, 62]]] as const) {
    const h = await simulate(seed, len, [...skip])
    const at = []
    const { addDays } = await import('./core/day')
    for (const today of [addDays(h.last, -5), h.last, addDays(h.last, 10)]) { // -5: later history is ignored
      const items = S.rebuildItems(h.introductions, h.attempts, h.corrections, today)
      const data = { schemaVersion: 2, settings: {} as never, introductions: h.introductions, items, attempts: h.attempts, sessions: [], corrections: h.corrections, days: [], finales: h.finales }
      // applyAttempt must match the rebuild with that attempt added
      const extraAttempt: Attempt = { id: 'x', itemId: null, refId: h.introductions[0]?.lessonId ?? 'none', kind: 'lesson', on: today, at: `${today}T23:00:00.000Z`, source: 'review', exampleId: 'e', correct: true, countsForSchedule: true }
      const p = C.courseProgress(data, units)
      at.push({
        today, items, applied: S.applyAttempt(items, extraAttempt), extraAttempt,
        queue: S.buildQueue(data, units, today), queue10: S.buildQueue(data, units, today, 10),
        gates: Object.fromEntries(units.flatMap((u) => u.lessonIds).map((id) => [id, S.lessonGate(data, units, id, today)])),
        levels: Object.fromEntries(items.map((i) => [i.id, S.levelOf(i, h.attempts, h.corrections, today)])),
        next: { kind: p.next.kind, id: p.next.kind === 'lesson' ? p.next.id : null, unit: p.next.kind === 'done' ? null : p.next.unit.id },
        unlocked: units.flatMap((u) => u.lessonIds).filter((id) => p.unlocked(id)),
      })
    }
    scenarios.push({ seed, introductions: h.introductions, attempts: h.attempts, corrections: h.corrections, finales: h.finales, migratedFinales: C.migratedFinales(h.introductions, units), at })
  }
  check('scheduler', scenarios)
}, 30000)

/* ---------------- questions (both languages) ---------------- */

test.each(['en', 'ar'] as const)('questions (%s)', async (lang) => {
  const { content, course, questions: Q } = await inLang(lang)
  const all = content.lessons
  const out = []
  // project the big example/fact objects to their ids (they are compared in content.*.json)
  const p = (q: ReturnType<typeof Q.makeQuestion>) => q && { ...q, example: q.example?.id, fact: q.fact?.id }
  for (const [i, id] of course.courseOrder.entries()) {
    const lesson = content.getLesson(id)!
    const introduced = course.courseOrder.slice(0, i)
    for (const kind of [undefined, 'identify', 'length', 'fact'] as const)
      for (const seed of [1, 2]) {
        const rng = Q.seeded(seed * 1000 + i)
        const ctx = { lessons: all, introduced, munfasilLength: (seed === 1 ? 4 : 5) as 4 | 5, rng, kind }
        out.push({ id, kind, seed, reps: seed, introduced: i, q: p(Q.makeQuestion({ refId: id, reps: seed, lastExampleId: `${id}#1` }, ctx)) })
      }
    const rng = Q.seeded(i)
    out.push({ id, pretest: true, introduced: i, q: p(Q.makeQuestion({ refId: id }, { lessons: all, introduced, munfasilLength: 4, rng: Q.seeded(i + 7), pretest: true, excludeExampleIds: [`${id}#2`] })) })
    const vs = lesson.confusableWith[0]
    if (vs) out.push({ id, vs, introduced: i, q: p(Q.makeQuestion({ refId: id }, { lessons: all, introduced, munfasilLength: 4, rng: Q.seeded(i + 9), vs })) })
    out.push({ id, check: true, introduced: i, qs: Q.checkQuestions(lesson, all, introduced, 4, rng).map(p) })
    out.push({ id, reasons: lesson.examples.map((e) => Q.reasonFor(lesson, e)) })
  }
  check(`questions.${lang}`, out)
}, 60000)

/* ---------------- store: migrations and backup validation ---------------- */

test('store migrate', async () => {
  const S = await import('./core/store')
  const settings = { id: 's', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z', deletedAt: null, timezone: 'Asia/Dubai' }
  const intro = (lessonId: string, on: string) => ({ lessonId, on, at: `${on}T08:00:00.000Z` })
  const v1Done = ['ibtida', 'makharij-jawf', 'izhar', 'idgh-g', 'idgh-n', 'iqlab', 'ikhfa', 'ghunnah', 'tabii', 'qal-s', 'qal-k']
  const inputs: unknown[] = [
    // v0: introductions derived from lesson items, partial lists and settings
    { schemaVersion: 0, settings: { ...settings, theme: 'dark' }, items: [{ id: 'lesson:izhar', kind: 'lesson', refId: 'izhar', introducedOn: '2025-02-01', createdAt: '2025-02-01T08:00:00.000Z' }] },
    // v1: finales from v1 lessons, junk rows dropped, wrong-typed settings reset, retired fields removed
    {
      schemaVersion: 1, phases: [1, 2], updatedAt: '2025-03-01T00:00:00.000Z', extra: { kept: true },
      settings: { ...settings, munfasilLength: '5', teacherDays: 'Mon', theme: 'light', introCourseDone: true, textSize: null, onboardedOn: '2025-01-02' },
      introductions: [...v1Done.map((id, k) => intro(id, `2025-02-${String(k + 1).padStart(2, '0')}`)), null, { lessonId: 'x' }, 'junk'],
      attempts: [{ id: 'a1', refId: 'izhar', kind: 'lesson', on: '2025-02-03', at: '2025-02-03T09:00:00.000Z', source: 'review', correct: true, countsForSchedule: true }, { id: 'a2' }],
      sessions: [{ id: 's1', on: '2025-02-05' }], days: [{ id: '2025-02-01' }, { parts: {} }],
      corrections: [{ id: 'c1', verseKey: '1:1', severity: 'khafi', createdAt: '2025-02-02T10:00:00.000Z', on: '2025-02-02', lessonIds: ['izhar'] }, { id: 'c2', verseKey: '1:2' }],
    },
    // v2 as written by the web today
    { schemaVersion: 2, settings: { ...settings, reciterId: 'minshawy' }, introductions: [intro('ibtida', '2025-05-01')], items: [], attempts: [], sessions: [], corrections: [], days: [], finales: [{ unitId: 'u0', on: '2025-05-01' }, { unitId: null }] },
    // v2 without finales (an older v2 build)
    { schemaVersion: 2, settings, introductions: [], items: [], attempts: [], sessions: [], corrections: [], days: [] },
  ]
  const bad: unknown[] = [null, [], 'x', {}, { schemaVersion: '2' }, { schemaVersion: 1.5 }, { schemaVersion: 3 }, { schemaVersion: 2, settings }, { schemaVersion: 2, introductions: [], attempts: [], sessions: [], corrections: [], days: [] }, { schemaVersion: 2, settings: [], introductions: [], attempts: [], sessions: [], corrections: [], days: [] }]
  check('store', {
    on: '2025-06-01',
    ok: inputs.map((raw) => ({ raw, out: S.migrate(structuredClone(raw), '2025-06-01') })),
    bad: bad.map((raw) => { try { S.migrate(raw, '2025-06-01'); return { raw, error: null } } catch (e) { return { raw, error: (e as Error).message } } }),
  })
})

/* ---------------- quran: tajweed segments, rulemap, unit ayahs, lesson steps ---------------- */

const surahFile = (n: number) => JSON.parse(readFileSync(`public/data/surah/${String(n).padStart(3, '0')}.json`, 'utf8'))

test('quran', async () => {
  const Q = await import('./quran')
  const R = await import('./content/rulemap')
  const { lessons } = await import('./content')
  const { units } = await import('./content/course')
  const { unitAyahs } = await import('./audio/download')
  const all = lessons.flatMap((l) => l.examples)
  const byKey = new Map<string, import('./core/types').Verse>()
  const verse = (k: string) => {
    const [s, a] = k.split(':').map(Number)
    if (!byKey.has(k)) byKey.set(k, surahFile(s)[a - 1])
    return byKey.get(k)!
  }
  // every example's ayah, plus whole short surahs and the hard cases (spike: 9:1, 6:80, 83:14, 79:46)
  for (const k of ['9:1', '6:80', '83:14', '79:46', '2:4', '2:258', ...Array.from({ length: 7 }, (_, i) => `1:${i + 1}`), ...[112, 113, 114].flatMap((s) => surahFile(s).map((v: { verseKey: string }) => v.verseKey))]) verse(k)
  for (const e of all) verse(e.verseKey)
  const keys = [...byKey.keys()]
  check('quran', {
    keys,
    segments: keys.map((k) => Q.wordSegments(verse(k))),
    inAyah: keys.map((k) => R.lessonsInAyah(verse(k))),
    targets: keys.map((k) => Object.fromEntries(lessons.map((l) => [l.id, R.findTargets(verse(k), l.id)]).filter(([, t]) => t.length))),
    also: all.map((e) => [e.id, R.alsoLessons(e, verse(e.verseKey), all.filter((o) => o.id !== e.id)), R.alsoLessons(e, undefined, [])]),
    unitAyahs: units.map((u) => [u.id, unitAyahs(u)]),
  })
}, 60000)

test('lesson steps', async () => {
  const S = await import('./screens/study/lessonSteps')
  const D = '2026-11-20', D2 = '2026-11-21'
  const ops: [string, string, string][] = [['visit', 'notice', D], ['complete', 'hear', D], ['complete', 'hear', D], ['visit', 'learn', D], ['complete', 'learn', D],
    ['visit', 'say', D2], ['complete', 'say', D2], ['score', 'check', D2], ['visit', 'find', D2], ['complete', 'recite', D2]]
  let s = S.freshSteps('hear', D)
  const out = []
  const exists = [() => true, (id: string) => id !== 'check' && id !== 'say']
  for (const [op, id, on] of ops) {
    const step = id as (typeof S.STEP_IDS)[number]
    s = op === 'visit' ? S.visitStep(s, step, on) : op === 'complete' ? S.completeStep(s, step, on) : S.scoreCheck(s, [true, false, true], on)
    out.push({ op, id, on, s, missing: exists.map((f) => S.missingSteps(s, f)), missingExceptRecite: S.missingSteps(s, () => true, 'recite'), score: S.checkScore(s) })
  }
  check('lessonSteps', { fresh: S.freshSteps('hear', D), required: S.REQUIRED, steps: S.STEP_IDS, minutes: S.LESSON_MINUTES, out })
})

test('router', async () => {
  const { parseHash } = await import('./app/router')
  const hashes = ['', '#/', '#/today', '#/learn/basics', '#/rules/ikhfa', '#/rules', '#/teacher/new', '#/teacher/4?sheet=1',
    '#/unit/u1?finale=1', '#/listen/93:1-93:5', '#/mutun/tuhfa?from=3&to=7', '#/plan/', 'learn/idgh-g', '#/learn/a%20b', '#/nope/x/y', '#/settings?s=wird']
  check('router', hashes.map((h) => [h, parseHash(h)]))
})

/* ---------------- player: segments, the word lamp, basmala ---------------- */

test('player segments', async () => {
  const P = await import('./audio/player')
  const { RECITERS } = await import('./quran')
  const verses = ['1:1', '2:4', '9:1', '80:21', '112:1', '112:4', '113:1', '114:4', '6:80', '83:14'].map((k) => {
    const [s, a] = k.split(':').map(Number)
    return surahFile(s)[a - 1]
  })
  const out = []
  for (const v of verses)
    for (const r of RECITERS) {
      const segs = P.segsOf(v, r.id)
      const end = segs?.length ? segs[segs.length - 1][3] + 500 : 0
      const at = segs ? Array.from({ length: Math.ceil(end / 37) }, (_, i) => i * 37).map((ms) => P.segAt(segs, ms)) : null
      out.push({ key: v.verseKey, reciter: r.id, segs, at, forWord: v.words.map((_: string, w: number) => P.segForWord(segs, w) ?? null) })
    }
  check('player', { segs: out, basmala: ['1:1', '1:2', '9:1', '2:1', '112:1', '112:2', '114:1'].map((k) => [k, P.needsBasmala(k)]) })
})
