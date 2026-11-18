import type { Day } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Local study day; the day starts at 03:00, so 01:30 still counts for the evening before. */
export function today(now: Date = new Date()): Day {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getHours() < 3 ? 1 : 0))
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Day arithmetic in UTC so DST never shifts a date.
const ms = (d: Day) => Date.parse(d + 'T00:00:00Z')

export const addDays = (d: Day, n: number): Day => new Date(ms(d) + n * 86400000).toISOString().slice(0, 10)

/** a − b in whole days. */
export const diffDays = (a: Day, b: Day): number => Math.round((ms(a) - ms(b)) / 86400000)

/** The 7 days of the week containing `d`; weekStart 6 = Saturday (design §9.3), 0 = Sunday. */
export function weekDays(d: Day, weekStart = 6): Day[] {
  const dow = new Date(ms(d)).getUTCDay()
  const start = addDays(d, -((dow - weekStart + 7) % 7))
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}
