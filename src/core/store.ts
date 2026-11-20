// One UserData object in localStorage, a tiny external store, and typed actions.
import { useSyncExternalStore } from 'react'
import type { Attempt, Correction, DayLog, PartMark, Session, Settings, UserData } from './types'
import { today } from './day'
import { applyAttempt, itemIdOf, rebuildItems } from './scheduler'
import { courseProgress, migratedFinales } from './course'
import { units } from '../content/course'

export const STORAGE_KEY = 'tajweed-path:v1'
export const SCHEMA_VERSION = 2

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
    textSize: 'm', theme: 'system', tajweedPatterns: false, tajweedColours: false, onboardedOn: null, lastExportOn: null,
  }
}

export function defaultData(): UserData {
  const at = nowIso()
  return {
    schemaVersion: SCHEMA_VERSION, updatedAt: at, settings: defaultSettings(at), introductions: [], items: [],
    attempts: [], sessions: [], corrections: [], days: [], finales: [],
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
    days: d.days ?? [],
  }),
  // v1 → v2 (spec §4): every introduced lesson stays done; units whose v1 lessons are all done count as passed (course.ts).
  1: d => ({ ...d, schemaVersion: 2, finales: migratedFinales(rows(Array.isArray(d.introductions) ? d.introductions : [], ['lessonId', 'on']), units) }),
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
  for (const k of ['introductions', 'attempts', 'sessions', 'corrections', 'days'] as const)
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
  const finales = rows(Array.isArray(d.finales) ? d.finales : [], ['unitId', 'on'])
  delete settings.introCourseDone // retired v1 fields
  const { phases: _v1Phases, ...rest } = d
  return {
    ...rest, settings, introductions, attempts, corrections, sessions, days, finales,
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
  commit({ ...data, settings: { ...data.settings, ...patch, onboardedOn: on, updatedAt: nowIso() } })
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

/** A lesson's Recite step done: the lesson is done and enters سبقي. */
export function introduceLesson(lessonId: string) {
  if (data.introductions.some(i => i.lessonId === lessonId)) return
  const on = today()
  const introductions = [...data.introductions, { lessonId, on, at: nowIso() }]
  commit({
    ...data, introductions,
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

/** The unit finale is recited ("I recited it"): the next unit opens (spec §4). */
export function completeFinale(unitId: string) {
  if (data.finales.some(f => f.unitId === unitId)) return
  const on = today()
  commit({
    ...data, finales: [...data.finales, { unitId, on }],
    days: withDay(data, on, l => ({ ...l, parts: { ...l.parts, recite: l.parts.recite ?? 'auto' } })),
  })
}

/** Default passages for a session plan (F6): the unit finale when it is next, then ayat with open corrections. */
export function suggestPassages(d: UserData = data): Session['plannedPassages'] {
  const out: Session['plannedPassages'] = []
  const next = courseProgress(d, units).next
  if (next.kind === 'finale' && next.unit.finale) out.push({ from: next.unit.finale.from, to: next.unit.finale.to, reason: 'milestone' })
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

export function updateSession(id: string, patch: Partial<Session>) {
  const sessions = data.sessions.map(s => (s.id === id ? { ...s, ...patch, id, updatedAt: nowIso() } : s))
  commit({ ...data, sessions })
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
