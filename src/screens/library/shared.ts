import { useSyncExternalStore } from 'react'
import type { Day, UserData } from '../../core/types'
import { itemIdOf, levelOf, hasOpenCorrection, type Level } from '../../core/scheduler'
import { today } from '../../core/day'
import { locale } from '../../i18n'

const sub = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb) }
}
export const useOnline = () => useSyncExternalStore(sub, () => navigator.onLine, () => true)

export interface LessonStatus { level: Level; correction: boolean; dueOn: Day | null; introduced: boolean }

export function lessonStatus(d: UserData, lessonId: string, on = today()): LessonStatus {
  const item = d.items.find((i) => i.id === itemIdOf('lesson', lessonId))
  return {
    level: levelOf(item, d.attempts, d.corrections, on),
    correction: hasOpenCorrection(lessonId, d.corrections),
    dueOn: item && item.state !== 'closed' && item.state !== 'suspended' ? item.dueOn : null,
    introduced: d.introductions.some((i) => i.lessonId === lessonId),
  }
}

/** '2026-11-20' → 'Fri 20 Nov' (UTC, so the study day never shifts). */
export const fmtDay = (d: Day) =>
  new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z'))
