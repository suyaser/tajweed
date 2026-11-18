// F9: "Add my wird to calendar" as a downloadable .ics (no server).
import type { Settings } from './types'
import { addDays, today } from './day'

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const esc = (s: string) => s.replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n')
const ymd = (d: string) => d.replace(/-/g, '')

/** Daily wird event at settings.wirdTime (floating local time) + weekly teacher-day event(s). */
export function makeWirdIcs(settings: Pick<Settings, 'wirdTime' | 'teacherDays' | 'teacherName'>, appUrl = '', now = new Date()): string {
  const start = today(now)
  const stamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const hhmm = settings.wirdTime.replace(':', '')
  const link = appUrl ? `${appUrl.split('#')[0]}#/today` : ''
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tajweed Path//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:wird@tajweed-path`, `DTSTAMP:${stamp}`,
    `DTSTART:${ymd(start)}T${hhmm}00`, 'DURATION:PT40M', 'RRULE:FREQ=DAILY',
    `SUMMARY:${esc('الورد · Tajweed wird')}`,
    `DESCRIPTION:${esc('Listen and repeat · سبق · recite and record · review' + (link ? `\n${link}` : ''))}`,
    ...(link ? [`URL:${link}`] : []),
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', `DESCRIPTION:${esc('Time for your wird')}`, 'END:VALARM',
    'END:VEVENT',
  ]
  if (settings.teacherDays.length) {
    // all-day weekly event starting on the next teacher day
    const days = [...settings.teacherDays].sort()
    const dow = new Date(start + 'T00:00:00Z').getUTCDay()
    const first = addDays(start, Math.min(...days.map(d => (d - dow + 7) % 7)))
    const who = settings.teacherName ? ` · ${settings.teacherName}` : ''
    lines.push(
      'BEGIN:VEVENT', 'UID:teacher@tajweed-path', `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(first)}`, `RRULE:FREQ=WEEKLY;BYDAY=${days.map(d => BYDAY[d]).join(',')}`,
      `SUMMARY:${esc('العرض على الشيخ · Teacher session' + who)}`, 'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
