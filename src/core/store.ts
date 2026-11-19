// One UserData object in localStorage, a tiny external store, and typed actions.
import { useSyncExternalStore } from 'react'
import type { Attempt, Correction, DayLog, PartMark, PhaseProgress, Session, Settings, UserData } from './types'
import { today } from './day'
import { applyAttempt, itemIdOf, rebuildItems } from './scheduler'
import { phases as contentPhases, getLesson } from '../content'

export const STORAGE_KEY = 'tajweed-path:v1'
export const SCHEMA_VERSION = 1

const nowIso = () => new Date().toISOString()
export const uuid = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 3) | 8).toString(16)
  })

function defaultSettings(at = nowIso()): Settings {
  let timezone = 'UTC'
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone } catch { /* keep UTC */ }
  return {
    id: uuid(), createdAt: at, updatedAt: at, deletedAt: null,
    wirdTime: '05:30', timezone, reciterId: 'husary-muallim', munfasilLength: 4, teacherDays: [],
    textSize: 'm', theme: 'system', tajweedPatterns: false, onboardedOn: null, introCourseDone: false, lastExportOn: null,
  }
}

const lockedPhases = (): PhaseProgress[] =>
  contentPhases.map(p => ({ id: p.id, status: 'locked', activatedOn: null, milestoneOn: null, passedOn: null, tasksDone: [] }))

export function defaultData(): UserData {
  const at = nowIso()
  return {
    schemaVersion: SCHEMA_VERSION, updatedAt: at, settings: defaultSettings(at), introductions: [], items: [],
    attempts: [], sessions: [], corrections: [], phases: lockedPhases(), days: [],
  }
}

/* ---------------- migrations ---------------- */

type Raw = any
/** migrations[n] turns schema n into n+1. Each is pure. */
export const migrations: Record<number, (d: Raw) => Raw> = {
  // v0 (pre-release): no introductions (derived from lesson items), settings and lists may be partial.
  0: d => ({
    ...d,
    schemaVersion: 1,
    settings: { ...defaultSettings(), ...d.settings },
    introductions:
      d.introductions ??
      (d.items ?? []).filter((i: Raw) => i.kind === 'lesson').map((i: Raw) => ({ lessonId: i.refId, on: i.introducedOn, at: i.createdAt })),
    items: d.items ?? [], attempts: d.attempts ?? [], sessions: d.sessions ?? [], corrections: d.corrections ?? [],
    phases: d.phases ?? lockedPhases(), days: d.days ?? [],
  }),
}

const isObj = (x: unknown): x is Raw => !!x && typeof x === 'object' && !Array.isArray(x)
/** Keeps only object rows that have every key field (a null row or a half-written one would crash a screen). */
const rows = (xs: Raw[], keys: string[], defaults: Raw = {}) =>
  xs.filter(x => isObj(x) && keys.every(k => x[k] != null)).map(x => ({ ...defaults, ...x }))

/** Validates, migrates to SCHEMA_VERSION and rebuilds the schedule. Throws on unknown/newer schemas. */
export function migrate(raw: Raw, on = today()): UserData {
  if (!raw || typeof raw !== 'object' || !Number.isInteger(raw.schemaVersion)) throw new Error('Not a Tajweed Path backup (no schema version).')
  if (raw.schemaVersion > SCHEMA_VERSION) throw new Error(`This backup is from a newer version of the app (schema ${raw.schemaVersion}).`)
  let d = raw
  for (let v = d.schemaVersion; v < SCHEMA_VERSION; v++) {
    if (!migrations[v]) throw new Error(`Unknown schema version ${v}.`)
    d = migrations[v](d)
  }
  for (const k of ['introductions', 'attempts', 'sessions', 'corrections', 'phases', 'days'] as const)
    if (!Array.isArray(d[k])) throw new Error(`Backup is missing "${k}".`)
  if (!isObj(d.settings)) throw new Error('Backup is missing settings.')
  // Settings: defaults for anything missing or of the wrong type.
  const def: Raw = defaultSettings()
  const settings: Raw = { ...def, ...d.settings }
  for (const k of Object.keys(def))
    if (def[k] != null && (typeof settings[k] !== typeof def[k] || Array.isArray(settings[k]) !== Array.isArray(def[k]))) settings[k] = def[k]
  const introductions = rows(d.introductions, ['lessonId', 'on'])
  const attempts = rows(d.attempts, ['id', 'refId', 'kind', 'on'])
  const corrections = rows(d.corrections, ['id', 'verseKey', 'severity'], { lessonIds: [], status: 'open', by: 'learner', sessionId: null, deletedAt: null })
  const sessions = rows(d.sessions, ['id', 'on'], { plannedPassages: [], milestoneResults: [], status: 'planned', deletedAt: null })
  const days = rows(d.days, ['id'], { parts: { listen: null, sabaq: null, recite: null, review: null }, listenSeconds: 0 })
  // Phases: always one row per content phase.
  const phases = lockedPhases().map(p => {
    const x = d.phases.find((y: Raw) => isObj(y) && y.id === p.id)
    return x ? { ...p, ...x, tasksDone: Array.isArray(x.tasksDone) ? x.tasksDone : [] } : p
  })
  return {
    ...d, settings, introductions, attempts, corrections, sessions, days, phases,
    items: rebuildItems(introductions, attempts, corrections, on),
  }
}

/* ---------------- the store ---------------- */

let data: UserData = defaultData()
let loadError: { message: string; raw: string } | null = null
const listeners = new Set<() => void>()

function load() {
  loadError = null
  let raw: string | null = null
  try { raw = localStorage.getItem(STORAGE_KEY) } catch { /* storage blocked */ }
  if (!raw) { data = defaultData(); return }
  try { data = migrate(JSON.parse(raw)) } catch (e) {
    // keep the old data untouched; the UI offers it as a download
    loadError = { message: (e as Error).message, raw }
    data = defaultData()
  }
}
load()

let persisted: boolean | null = null
/** Asks the browser to keep our storage. Only after onboarding: Firefox shows a prompt for it (review m7). */
function requestPersist() {
  try {
    navigator.storage?.persist?.().then(ok => { persisted = ok }, () => {})
  } catch { /* not supported */ }
}
if (data.settings.onboardedOn) requestPersist()
export const storagePersisted = () => persisted

// Another tab (or the installed app beside a browser tab) saved: take its data instead of overwriting it later (M2).
if (typeof window !== 'undefined')
  window.addEventListener('storage', e => { if (e.key === STORAGE_KEY || e.key === null) reload() })

/** Set when the last save failed (storage full or blocked): the data lives only in memory until a save succeeds (M3). */
let saveError = false
export const getSaveError = () => saveError

export const getLoadError = () => loadError
export const getSnapshot = () => data
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
export const useData = (): UserData => useSyncExternalStore(subscribe, getSnapshot)

function commit(next: UserData) {
  data = { ...next, updatedAt: nowIso() }
  if (!loadError)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); saveError = false } catch { saveError = true }
  listeners.forEach(l => l())
}

/* ---------------- actions ---------------- */

export function updateSettings(patch: Partial<Settings>) {
  commit({ ...data, settings: { ...data.settings, ...patch, updatedAt: nowIso() } })
}

export function completeOnboarding(patch: Partial<Settings>) {
  const on = today()
  const settings = { ...data.settings, ...patch, onboardedOn: on, updatedAt: nowIso() }
  const episodeTasks = (contentPhases[0]?.tasks ?? []).flatMap((t, i) => (/episode/i.test(t) ? [i] : []))
  const phases = lockedPhases().map((p): PhaseProgress =>
    p.id === 1 ? { ...p, status: 'active', activatedOn: on, tasksDone: settings.introCourseDone ? episodeTasks : [] } : p,
  )
  commit({ ...data, settings, phases })
  requestPersist()
}

function withDay(d: UserData, day: string, fn: (l: DayLog) => DayLog): DayLog[] {
  const cur = d.days.find(x => x.id === day) ?? { id: day, parts: { listen: null, sabaq: null, recite: null, review: null }, listenSeconds: 0 }
  return [...d.days.filter(x => x.id !== day), fn(cur)].sort((a, b) => (a.id < b.id ? -1 : 1))
}

export function markDayPart(part: keyof DayLog['parts'], mark: PartMark = 'manual', day = today()) {
  commit({ ...data, days: withDay(data, day, l => ({ ...l, parts: { ...l.parts, [part]: mark } })) })
}

/** A saved recording marks the recite part done (spec F1), unless it is already marked. */
export function noteRecording(day = today()) {
  commit({ ...data, days: withDay(data, day, l => ({ ...l, parts: { ...l.parts, recite: l.parts.recite ?? 'auto' } })) })
}

/** Adds listening time; marks the listen part done at 3 minutes. */
export function addListenSeconds(seconds: number, day = today()) {
  commit({
    ...data,
    days: withDay(data, day, l => {
      const listenSeconds = l.listenSeconds + seconds
      return { ...l, listenSeconds, parts: { ...l.parts, listen: l.parts.listen ?? (listenSeconds >= 180 ? 'auto' : null) } }
    }),
  })
}

/** Opens the next locked phase, unless a later phase is already open (it may open at half the milestone). */
const activateNext = (phases: PhaseProgress[], after: number, on: string) => {
  if (phases.some(p => p.id > after && (p.status === 'active' || p.status === 'milestone'))) return phases
  const next = phases.filter(p => p.id > after && p.status === 'locked').sort((a, b) => a.id - b.id)[0]
  return phases.map(p => (p === next ? { ...p, status: 'active' as const, activatedOn: on } : p))
}

/** F2 step 3 done: the lesson enters سبقي. Moves its phase to `milestone` when all its lessons are in. */
export function introduceLesson(lessonId: string) {
  if (data.introductions.some(i => i.lessonId === lessonId)) return
  const on = today()
  const introductions = [...data.introductions, { lessonId, on, at: nowIso() }]
  const done = new Set(introductions.map(i => i.lessonId))
  const phaseId = getLesson(lessonId)?.phaseId
  const all = contentPhases.find(p => p.id === phaseId)?.lessonIds.every(id => done.has(id))
  const moved = data.phases.map(p =>
    p.id === phaseId && all && p.status === 'active' ? { ...p, status: 'milestone' as const, milestoneOn: on } : p,
  )
  const phases = settlePhases({ ...data, phases: moved }) // half the milestone may already be passed
  commit({
    ...data, introductions, phases,
    items: rebuildItems(introductions, data.attempts, data.corrections, on),
    days: withDay(data, on, l => ({ ...l, parts: { ...l.parts, sabaq: l.parts.sabaq ?? 'auto' } })),
  })
}

export type NewAttempt = Omit<Attempt, 'id' | 'on' | 'at' | 'itemId'> & Partial<Pick<Attempt, 'on' | 'at'>>

/** Writes the attempt first, then moves the schedule (spec F3). */
export function recordAttempt(a: NewAttempt): Attempt {
  const id = itemIdOf(a.kind, a.refId)
  const full: Attempt = { on: today(), at: nowIso(), ...a, id: uuid(), itemId: data.items.some(i => i.id === id) ? id : null }
  commit({ ...data, attempts: [...data.attempts, full], items: applyAttempt(data.items, full) })
  return full
}

/** Default passages for a session plan (F6): milestones due, then ayat with open corrections. */
export function suggestPassages(d: UserData = data): Session['plannedPassages'] {
  const out: Session['plannedPassages'] = []
  const passed = new Set(d.sessions.flatMap(s => s.milestoneResults.filter(r => r.result === 'passed').map(r => `${r.phaseId}/${r.passageId}`)))
  for (const p of d.phases) {
    if (p.status !== 'milestone' && p.status !== 'skipped') continue
    for (const m of contentPhases.find(c => c.id === p.id)?.milestone ?? [])
      if (!passed.has(`${p.id}/${m.id}`)) out.push({ from: m.from, to: m.to, reason: 'milestone' })
  }
  for (const c of d.corrections)
    if (!c.deletedAt && c.status === 'open' && !out.some(x => x.from === c.verseKey && x.to === c.verseKey))
      out.push({ from: c.verseKey, to: c.verseKey, reason: 'correction' })
  return out
}

export function planSession(input: Partial<Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>> = {}): Session {
  const at = nowIso()
  const s: Session = {
    id: uuid(), createdAt: at, updatedAt: at, deletedAt: null, on: today(), teacherName: data.settings.teacherName,
    plannedPassages: suggestPassages(), milestoneResults: [], status: 'planned', ...input,
  }
  commit({ ...data, sessions: [...data.sessions, s] })
  return s
}
export const startSession = planSession

/**
 * Phases whose every milestone passage has passed become `passed`. The next phase opens then, or as soon as half of
 * a phase's milestone passages have passed (decision 12); the rest stay on every session plan.
 */
function settlePhases(d: UserData): PhaseProgress[] {
  const on = today()
  let phases = d.phases
  for (const cp of contentPhases) {
    const p = phases.find(x => x.id === cp.id)
    if (!p || p.status === 'passed' || p.status === 'locked' || !cp.milestone.length) continue
    const passed = cp.milestone.filter(m => d.sessions.some(s => !s.deletedAt && s.milestoneResults.some(r => r.phaseId === cp.id && r.passageId === m.id && r.result === 'passed'))).length
    const all = passed === cp.milestone.length
    if (all) phases = phases.map(x => (x.id === cp.id ? { ...x, status: 'passed' as const, passedOn: on } : x))
    if ((all || (p.status === 'milestone' && passed * 2 >= cp.milestone.length))) phases = activateNext(phases, cp.id, on)
  }
  return phases
}

export function updateSession(id: string, patch: Partial<Session>) {
  const sessions = data.sessions.map(s => (s.id === id ? { ...s, ...patch, id, updatedAt: nowIso() } : s))
  const next = { ...data, sessions }
  commit({ ...next, phases: settlePhases(next) })
}

export interface NewCorrection {
  verseKey: string; severity: Correction['severity']; lessonIds?: string[]; wordPosition?: number; word?: string
  note?: string; sessionId?: string | null; by?: Correction['by']
}

/** §6.3: a new correction item, due tomorrow; linked manzil lessons back to tomorrow. */
export function logCorrection(input: NewCorrection): Correction {
  const at = nowIso()
  const on = today()
  const c: Correction = {
    id: uuid(), createdAt: at, updatedAt: at, deletedAt: null, on, sessionId: input.sessionId ?? null,
    verseKey: input.verseKey, severity: input.severity, lessonIds: (input.lessonIds ?? []).slice(0, 2),
    status: 'open', by: input.by ?? 'learner',
    ...(input.wordPosition != null ? { wordPosition: input.wordPosition } : {}), ...(input.word ? { word: input.word } : {}), ...(input.note ? { note: input.note } : {}),
  }
  const corrections = [...data.corrections, c]
  commit({ ...data, corrections, items: rebuildItems(data.introductions, data.attempts, corrections, on) })
  return c
}

/** Undo a correction just logged by mistake (soft delete, its review item goes with it). */
export function undoCorrection(id: string) {
  const at = nowIso()
  const corrections = data.corrections.map(c => (c.id === id ? { ...c, deletedAt: at, updatedAt: at } : c))
  commit({ ...data, corrections, items: rebuildItems(data.introductions, data.attempts, corrections, today()) })
}

/** Teacher re-check: "correct now" closes it; "still wrong" is a lapse and sends its lessons back to tomorrow. */
export function resolveCorrection(id: string, result: 'correct' | 'still_wrong', sessionId?: string) {
  const correct = result === 'correct'
  const at = nowIso()
  const a: Attempt = {
    id: uuid(), itemId: itemIdOf('correction', id), refId: id, kind: 'correction', on: today(), at, source: 'teacher',
    chosen: correct ? 'passed' : 'still_wrong', correct, countsForSchedule: true,
  }
  const corrections = data.corrections.map(c =>
    c.id === id && correct ? { ...c, status: 'resolved' as const, resolvedInSessionId: sessionId, updatedAt: at } : c,
  )
  commit({ ...data, corrections, attempts: [...data.attempts, a], items: applyAttempt(data.items, a) })
}

export function setPhaseStatus(id: number, status: PhaseProgress['status']) {
  const on = today()
  const stamp = { active: 'activatedOn', milestone: 'milestoneOn', passed: 'passedOn' } as const
  const key = stamp[status as keyof typeof stamp]
  let phases = data.phases.map(p => (p.id === id ? { ...p, status, ...(key ? { [key]: on } : {}) } : p))
  if (status === 'passed') phases = activateNext(phases, id, on)
  commit({ ...data, phases })
}

/** Soft gate (F7): continue without the milestone; it stays in every session plan. */
export function skipPhase(id: number, reason: string) {
  const phases = data.phases.map(p => (p.id === id ? { ...p, status: 'skipped' as const, skipReason: reason } : p))
  commit({ ...data, phases: activateNext(phases, id, today()) })
}

export function toggleTask(phaseId: number, index: number) {
  commit({
    ...data,
    phases: data.phases.map(p =>
      p.id !== phaseId ? p : { ...p, tasksDone: p.tasksDone.includes(index) ? p.tasksDone.filter(i => i !== index) : [...p.tasksDone, index].sort((a, b) => a - b) },
    ),
  })
}

/** Full backup (recordings live in IndexedDB and are not included). Records lastExportOn. */
export function exportJson(): string {
  updateSettings({ lastExportOn: today() })
  return JSON.stringify(data)
}

/** Replaces everything. Throws (and changes nothing) on an invalid, unknown or newer backup. */
export function importJson(text: string) {
  let raw: unknown
  try { raw = JSON.parse(text) } catch { throw new Error('This file is not valid JSON.') }
  const next = migrate(raw)
  loadError = null
  commit(next)
}

export function resetAll() {
  loadError = null
  commit(defaultData())
}

/** Re-reads localStorage (tests, or another tab). */
export const reload = () => { load(); listeners.forEach(l => l()) }
