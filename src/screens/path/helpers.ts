// Pure helpers for the Teacher and Path screens (tested in helpers.test.ts).
import type { Attempt, Correction, Day, Introduction, Session, UserData, Verse, VerseKey } from '../../core/types'
import { addDays, weekDays } from '../../core/day'
import { ayahCount, surahName, toArabicDigits } from '../../quran'
import type { DayMark } from '../../components'
import { RULE_LESSONS, wordSpan } from '../../content/rulemap'
import { digits, isAr, locale, t } from '../../i18n'
import { tn } from '../study/i18n'

export type Planned = Session['plannedPassages'][number]

const parse = (k: VerseKey) => k.split(':').map(Number) as [number, number]
const cmp = (a: VerseKey, b: VerseKey) => {
  const [s1, a1] = parse(a)
  const [s2, a2] = parse(b)
  return s1 - s2 || a1 - a2
}
export const inRange = (key: VerseKey, from: VerseKey, to: VerseKey) => cmp(key, from) >= 0 && cmp(key, to) <= 0

/** 'الضحى ٥', 'الضحى ١–١١', 'الفاتحة' (whole surah), 'الإخلاص – الناس' (whole surahs), 'النبأ ٣ – عبس ٤٢'. */
export function refLabel(from: VerseKey, to: VerseKey = from): string {
  const [s1, a1] = parse(from)
  const [s2, a2] = parse(to)
  const whole = a1 === 1 && a2 === ayahCount(s2)
  if (s1 === s2) {
    if (whole && a2 > 1) return surahName(s1)
    return `${surahName(s1)} ${toArabicDigits(a1)}${a2 !== a1 ? '–' + toArabicDigits(a2) : ''}`
  }
  if (whole) return `${surahName(s1)} – ${surahName(s2)}`
  return `${surahName(s1)} ${toArabicDigits(a1)} – ${surahName(s2)} ${toArabicDigits(a2)}`
}

/** 'نَسْتَعِينُ · الفاتحة ٥', or just the reference for a whole-ayah correction (UX M8). */
export const corrLabel = (c: { verseKey: VerseKey; word?: string }) => (c.word ? `${c.word} · ` : '') + refLabel(c.verseKey)

/** Spec F5: `#/listen/93:1-93:5`, or `#/listen/93:5` for one ayah. */
export const listenHref = (from: VerseKey, to: VerseKey = from) => `#/listen/${from}${to !== from ? '-' + to : ''}`

/** First day ≥ `from` that is a teacher day (0=Sun..6=Sat), or null when none are set. */
export function nextTeacherDay(teacherDays: number[], from: Day): Day | null {
  if (!teacherDays.length) return null
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i)
    if (teacherDays.includes(new Date(d + 'T00:00:00Z').getUTCDay())) return d
  }
  return null
}

const DAY_FMT = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
/** 'Thu 20 Nov' */
export const dayLabel = (d: Day) => digits(DAY_FMT.format(new Date(d + 'T00:00:00Z')).replace(',', ''))
export const WEEKDAYS = isAr ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const live = <T extends { deletedAt: string | null }>(xs: T[]) => xs.filter((x) => !x.deletedAt)

/** Upcoming planned session (earliest on/after `on`), else the latest unfinished one. */
export function upcomingSession(sessions: Session[], on: Day): Session | undefined {
  const planned = live(sessions).filter((s) => s.status === 'planned').sort((a, b) => (a.on < b.on ? -1 : 1))
  return planned.find((s) => s.on >= on) ?? planned[planned.length - 1]
}

export function severityCounts(corrections: Correction[], sessionId?: string) {
  const cs = live(corrections).filter((c) => sessionId === undefined || c.sessionId === sessionId)
  return { jali: cs.filter((c) => c.severity === 'jali').length, khafi: cs.filter((c) => c.severity === 'khafi').length }
}

/** Appends passages not already in the list (same from/to). */
export function mergePassages(a: Planned[], b: Planned[]): Planned[] {
  const out = [...a]
  for (const p of b) if (!out.some((x) => x.from === p.from && x.to === p.to)) out.push(p)
  return out
}

export { wordSpan }

/**
 * Rule suggestions for a corrected word: lessons from the tajweed spans on that word (or the whole ayah when no
 * word), then the most recently introduced lessons. `known` filters to lesson ids that exist.
 */
export function likelyLessons(v: Pick<Verse, 'words' | 'tajweed'> | undefined, word: number | undefined, introductions: Introduction[], known: (id: string) => boolean, max = 5): string[] {
  const out: string[] = []
  const add = (id?: string) => { if (id && known(id) && !out.includes(id)) out.push(id) }
  if (v) {
    const [a, b] = word ? wordSpan(v, word) : [0, Infinity]
    for (const s of v.tajweed) if (s.start < b && s.end > a) add(RULE_LESSONS[s.rule]?.[0] ?? s.rule)
  }
  for (const i of [...introductions].sort((x, y) => (x.at < y.at ? 1 : -1))) add(i.lessonId)
  return out.slice(0, max)
}

/** Days with any study: a wird part marked, listening, an answer, or a lesson introduced. */
export function studiedDays(d: Pick<UserData, 'days' | 'attempts' | 'introductions'>): Set<Day> {
  const s = new Set<Day>()
  for (const l of d.days) if (l.listenSeconds > 0 || Object.values(l.parts).some(Boolean)) s.add(l.id)
  for (const a of d.attempts) if (a.source !== 'teacher') s.add(a.on)
  for (const i of d.introductions) s.add(i.on)
  return s
}

/** Last `n` weeks (Saturday first), oldest first, each as 7 DayMarks; `full` = weeks with ≥ 5 days studied, counting only weeks since `since`. */
export function weeks(studied: Set<Day>, today: Day, n = 16, since?: Day | null) {
  const out = Array.from({ length: n }, (_, i) => {
    const days = weekDays(addDays(today, -7 * (n - 1 - i)))
    const marks: DayMark[] = days.map((d) => (d > today ? 'future' : studied.has(d) ? 'studied' : 'not'))
    return { start: days[0], marks, count: marks.filter((m) => m === 'studied').length, counted: !since || days[6] >= since }
  })
  const counted = out.filter((w) => w.counted)
  return { weeks: out, full: counted.filter((w) => w.count >= 5).length, total: counted.length }
}

/** Quiz accuracy on lesson answers in the last `days` days (pretest excluded). */
export function accuracy(attempts: Attempt[], today: Day, days = 30) {
  const from = addDays(today, -(days - 1))
  const xs = attempts.filter((a) => a.kind === 'lesson' && a.source !== 'pretest' && a.source !== 'teacher' && a.source !== 'selfrate' && a.on >= from && a.on <= today)
  return { correct: xs.filter((a) => a.correct).length, total: xs.length }
}

export function formatBytes(n: number): string {
  if (n < 1024) return t('{n} B', { n })
  if (n < 1024 * 1024) return t('{n} KB', { n: digits((n / 1024).toFixed(n < 10240 ? 1 : 0)) })
  return t('{n} MB', { n: digits((n / 1024 / 1024).toFixed(1)) })
}

/** "3 days ago" style for a past day. */
export function daysAgo(d: Day, today: Day): string {
  const n = Math.round((Date.parse(today) - Date.parse(d)) / 86400000)
  return n <= 0 ? t('today') : n === 1 ? t('yesterday') : tn('{n} days ago', '{n} days ago', n)
}
