// Shared contract between modules. Change only with care: every module imports from here.
// Source of truth: docs/02-product-spec.md §6–7 and docs/03-design.md.

export type Day = string // 'YYYY-MM-DD', local day that starts at 03:00
export type Iso = string // ISO timestamp
export type VerseKey = string // '2:5'

/* ---------------- Content (bundled, read-only) ---------------- */

export type ColourKey =
  | 'clear' | 'ghunnah' | 'silent' | 'merge'
  | 'madd2' | 'madd45' | 'madd246' | 'madd6'
  | 'qalqalah' | 'heavy' | 'light'

export interface Topic { id: string; nameAr: string; nameEn: string; intro: string; order: number }

export interface Example {
  id: string // `${lessonId}#${n}`
  lessonId: string
  verseKey: VerseKey
  wordFrom: number // 1-based, Tanzil Uthmani split on spaces, basmala removed
  wordTo: number
  text: string // exact Tanzil text of words wordFrom..wordTo
  focus: string // substring of text that shows the rule
  stopping: boolean
  note?: string
}

export interface FactQuestion { id: string; lessonId: string; prompt: string; options: string[]; answer: number; explanation: string }

export interface Lesson {
  id: string
  topicId: string
  phaseId: number
  order: number
  nameAr: string
  nameEn: string
  colour: ColourKey
  summary: string // the definition
  letters?: string // space-separated letters for tiles
  counts?: { min: number; max: number; note?: string }
  conditions?: string[]
  list?: [string, string][]
  tip?: string
  examples: Example[]
  facts: FactQuestion[]
  questionKinds: QuestionKind[]
  confusableWith: string[]
  sources: { title: string; locator: string }[]
  review: { status: 'verified' | 'needs-teacher'; notes?: string }
}

export interface ConfusablePair { id: string; a: string; b: string; hint: string }

export interface Phase {
  id: number // 1..6
  weeks: string
  nameAr: string
  nameEn: string
  goal: string
  doneWhen: string
  lessonIds: string[]
  tasks: string[]
  milestone: { id: string; label: string; from: VerseKey; to: VerseKey }[]
}

export interface MatnLine {
  id: string // 'tuhfa-24'
  matn: 'tuhfa' | 'jazariyya'
  n: number
  sadr: string
  ajz: string
  page?: string
  url?: string
  lessonIds: string[]
  gloss?: string
  verified: 'two-copies' | 'single-copy'
}

export interface Reciter { id: string; nameAr: string; nameEn: string; folder: string; style: 'muallim' | 'murattal'; hasTimings: boolean }

/** One ayah as served from public/data/surah/NNN.json */
export interface Verse {
  verseKey: VerseKey
  text: string // Tanzil Uthmani, verbatim, basmala removed (except 1:1)
  words: string[] // text split on spaces
  tajweed: { rule: string; start: number; end: number; src: 'cpfair' | 'ours' }[] // code-point offsets into text
  timings?: Record<string, [wordFrom: number, wordTo: number, startMs: number, endMs: number][]> // by reciter id
}

/* ---------------- User data (local, sync-ready) ---------------- */

interface Row { id: string; createdAt: Iso; updatedAt: Iso; deletedAt: Iso | null }

export type QuestionKind = 'identify' | 'length' | 'fact'
export type ItemKind = 'lesson' | 'correction' | 'matn' | 'contrast'
export type ItemState = 'sabqi' | 'manzil' | 'closed' | 'suspended'

export interface Settings extends Row {
  wirdTime: string // 'HH:MM'
  timezone: string
  reciterId: string
  munfasilLength: 4 | 5
  teacherDays: number[] // 0=Sun..6=Sat
  teacherName?: string
  textSize: 'm' | 'l' | 'xl'
  theme: 'system' | 'light' | 'dark'
  tajweedPatterns: boolean // second cue for colour
  onboardedOn: Day | null
  introCourseDone: boolean
  lastExportOn: Day | null
}

export interface ReviewItem extends Row {
  kind: ItemKind
  refId: string
  state: ItemState
  introducedOn: Day
  step: number // 0..6
  dueOn: Day
  lastReviewedOn: Day | null
  lastExampleId: string | null
  reps: number
  lapses: number
  correctedBeforeTaught?: boolean
  sabqiCorrect?: number // correct sabqi answers so far (graduation rule, §6.3)
  severity?: 'jali' | 'khafi' // correction items: sets the step cap
  linkedLessonIds?: string[] // correction items: lessons reset on "still wrong"
}

export type AttemptSource = 'pretest' | 'learn' | 'review' | 'relearn' | 'early' | 'analyser' | 'selfrate' | 'teacher'

export interface Attempt {
  id: string
  itemId: string | null // null for pretest (lesson not yet an item)
  refId: string // lesson/correction id, so schedules can be rebuilt
  kind: ItemKind
  on: Day
  at: Iso
  source: AttemptSource
  questionKind?: QuestionKind
  exampleId?: string
  chosen?: string
  correct: boolean
  countsForSchedule: boolean
}

export interface Session extends Row {
  on: Day
  teacherName?: string
  plannedPassages: { from: VerseKey; to: VerseKey; reason: 'milestone' | 'correction' | 'recent' | 'ask' }[]
  notes?: string
  milestoneResults: { phaseId: number; passageId: string; result: 'passed' | 'not_yet' }[]
  status: 'planned' | 'done'
}

export interface Correction extends Row {
  sessionId: string | null
  verseKey: VerseKey
  wordPosition?: number
  severity: 'jali' | 'khafi'
  lessonIds: string[]
  note?: string
  status: 'open' | 'resolved'
  resolvedInSessionId?: string
  by: 'learner' | 'teacher'
  on?: Day // study day it was logged (falls back to createdAt)
}

export interface PhaseProgress {
  id: number
  status: 'locked' | 'active' | 'milestone' | 'passed' | 'skipped'
  activatedOn: Day | null
  milestoneOn: Day | null
  passedOn: Day | null
  skipReason?: string
  tasksDone: number[]
}

export type PartMark = null | 'auto' | 'manual'
export interface DayLog { id: Day; parts: { listen: PartMark; sabaq: PartMark; recite: PartMark; review: PartMark }; listenSeconds: number }

export interface Introduction { lessonId: string; on: Day; at: Iso }

export interface UserData {
  schemaVersion: number
  updatedAt?: Iso
  settings: Settings
  introductions: Introduction[] // when each lesson entered review (F2 done)
  items: ReviewItem[] // cache, rebuildable from introductions + attempts + corrections
  attempts: Attempt[]
  sessions: Session[]
  corrections: Correction[]
  phases: PhaseProgress[]
  days: DayLog[]
}

export interface Recording { id: string; from: VerseKey; to: VerseKey; createdAt: Iso; durationMs: number; mime: string; blob: Blob }
