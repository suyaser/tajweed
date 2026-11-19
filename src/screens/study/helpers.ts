// Small pure helpers for the study-loop screens (Today, Learn, Review).
import type { ConfusablePair, Day, Phase, Session, UserData, VerseKey } from '../../core/types'
import { studiedDays } from '../path/helpers'
import type { DayMark } from '../../components'
import { addDays, diffDays, weekDays } from '../../core/day'
import { ayahCount, surahName, toArabicDigits } from '../../quran'

const parse = (k: VerseKey) => k.split(':').map(Number) as [number, number]

/** 'الضحى ٥' (design B4: never 93:5 on screen). */
export const verseRef = (k: VerseKey) => {
  const [s, a] = parse(k)
  return `${surahName(s)} ${toArabicDigits(a)}`
}

/** 'الضحى ١–١١', or two refs joined across surahs. */
export function rangeRef(from: VerseKey, to: VerseKey) {
  if (from === to) return verseRef(from)
  const [s1, a1] = parse(from)
  const [s2, a2] = parse(to)
  return s1 === s2 ? `${surahName(s1)} ${toArabicDigits(a1)}–${toArabicDigits(a2)}` : `${verseRef(from)} – ${verseRef(to)}`
}

/** Route param for #/listen/:range. */
export const rangeParam = (from: VerseKey, to: VerseKey = from) => (from === to ? from : `${from}-${to}`)

export const wholeSurah = (s: number) => ({ from: `${s}:1`, to: `${s}:${ayahCount(s)}` })

/** The pair's authored hint, only when the learner chose the answer's confusable partner (design §5.5). */
export function confusableHint(pairs: ConfusablePair[], answerId: string, chosenId: string): string | undefined {
  return pairs.find(p => (p.a === answerId && p.b === chosenId) || (p.b === answerId && p.a === chosenId))?.hint
}

/** 'today' · 'tomorrow' · '30 Nov' (Western digits for UI dates, B4). */
export function dueLabel(due: Day, today: Day) {
  const n = diffDays(due, today)
  if (n <= 0) return 'today'
  if (n === 1) return 'tomorrow'
  return new Date(due + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/** Today's week dots: the same "studied" rule as Progress (any wird part, listening, a recording, an answer). */
export function week(d: Pick<UserData, 'days' | 'attempts' | 'introductions'>, today: Day, startedOn?: Day | null) {
  const studied = studiedDays(d)
  const ds = weekDays(today)
  // days before onboarding are "before you started", never "not studied" (m9)
  const marks: DayMark[] = ds.map(x => (x > today ? 'future' : studied.has(x) ? 'studied' : startedOn && x < startedOn ? 'before' : 'not'))
  const month = [...studied].filter(x => x.slice(0, 7) === today.slice(0, 7) && x <= today).length
  return { marks, todayIndex: ds.indexOf(today), count: marks.filter(m => m === 'studied').length, month }
}

/** 'today' | 'tomorrow' when a planned session or a teacher weekday is that close. */
export function teacherNear(teacherDays: number[], sessions: Session[], today: Day): { when: 'today' | 'tomorrow'; session?: Session } | null {
  for (const [when, d] of [['today', today], ['tomorrow', addDays(today, 1)]] as const) {
    const session = sessions.find(s => !s.deletedAt && s.status === 'planned' && s.on === d)
    if (session || teacherDays.includes(new Date(d + 'T00:00:00Z').getUTCDay())) return { when, session }
  }
  return null
}

/** Never two items with the same key back to back when another item can sit between them (design §8.1, interleaving). */
export function spread<T>(xs: T[], keyOf: (x: T) => string): T[] {
  const rest = [...xs]
  const out: T[] = []
  while (rest.length) {
    const prev = out.length ? keyOf(out[out.length - 1]) : undefined
    const i = Math.max(0, rest.findIndex(x => keyOf(x) !== prev))
    out.push(rest.splice(i, 1)[0])
  }
  return out
}

/** The lesson example's surah when short (≤ 20 ayat), else the example ayah ± 2: a whole long surah is too much to load and play (M7). */
export function aroundAyah(k: VerseKey): { from: VerseKey; to: VerseKey } {
  const [s, a] = parse(k)
  const n = ayahCount(s)
  if (n <= 20) return wholeSurah(s)
  return { from: `${s}:${Math.max(1, a - 2)}`, to: `${s}:${Math.min(n, a + 2)}` }
}

/** Spec F1: the active milestone passage, else around today's lesson example, else the active phase's first passage. */
export function currentPassage(data: UserData, phases: Phase[], lessonExampleKey?: VerseKey): { from: VerseKey; to: VerseKey } {
  const passed = new Set(data.sessions.flatMap(s => s.milestoneResults.filter(r => r.result === 'passed').map(r => `${r.phaseId}/${r.passageId}`)))
  for (const p of data.phases.filter(p => p.status === 'milestone').sort((a, b) => a.id - b.id)) {
    const m = phases.find(c => c.id === p.id)?.milestone.find(m => !passed.has(`${p.id}/${m.id}`))
    if (m) return { from: m.from, to: m.to }
  }
  if (lessonExampleKey) return aroundAyah(lessonExampleKey)
  const active = data.phases.find(p => p.status === 'active')
  const m = phases.find(c => c.id === active?.id)?.milestone[0]
  return m ? { from: m.from, to: m.to } : { from: '1:1', to: '1:7' }
}

/* ---- tiny per-device memory (conveniences only, never schedule state) ---- */
const KEY = 'tajweed-path:study'
type Mem = { skipSabaq?: Day; lesson?: { id: string; on: Day; step: number }; dismissed?: Record<string, Day> }
export function mem(): Mem {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Mem } catch { return {} }
}
export function setMem(patch: Partial<Mem>) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...mem(), ...patch })) } catch { /* storage blocked: forget */ }
}
