// Pieces shared by the rule library (Rules) and the rule card (Rule).
import type { ColourKey } from '../../core/types'
import type { Level } from '../../core/scheduler'
import { RULE_BG, T } from '../../components'
import { t } from '../../i18n'
import { cn } from '@/lib/utils'
import { Chip, LetterTile, type ChipTone } from '@/components/kit'

const LEVEL: Record<Level, { icon: string; tone: ChipTone; word: string }> = {
  'not-started': { icon: 'radio_button_unchecked', tone: 'neutral', word: 'not started' },
  learning: { icon: 'clock_loader_40', tone: 'gold', word: 'learning' },
  known: { icon: 'check_circle', tone: 'success', word: 'known' },
  strong: { icon: 'verified', tone: 'primary', word: 'strong' },
}

/** Recognition level (not a score): not started · learning · known · strong. */
export function LevelChip({ level, detail }: { level: Level; detail?: string }) {
  const l = LEVEL[level]
  return <Chip tone={l.tone} icon={l.icon} fill={level !== 'not-started'}>{t(l.word)}{detail && <span className="font-normal opacity-80"> · {detail}</span>}</Chip>
}

/** Icon-only level mark with a screen-reader word. */
export function LevelMark({ level }: { level: Level }) {
  const l = LEVEL[level]
  return <Chip tone={l.tone} icon={l.icon} fill={level !== 'not-started'} />
}

/** The rule's muṣḥaf colour as a small dot (colours views only). */
export function ColourDot({ colour, className }: { colour?: ColourKey | null; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-2.5 shrink-0 rounded-full', colour ? RULE_BG[colour] : 'bg-gold', className)} />
}

/** Tiles for a letters string. Content may carry groups (`·`), group labels (`الهمس:`) and a gloss in brackets
 *  (`ا و ي (حروف المد)`): groups get a gap, labels and the gloss are text, never tiles (M5). Latin → plain text. */
export function Letters({ letters, className }: { letters: string; className?: string }) {
  if (/[A-Za-z]/.test(letters)) return <span><T>{letters}</T></span>
  const note = letters.match(/\(([^)]+)\)/)?.[1]
  const groups = letters.replace(/\([^)]*\)/g, '').split('·').map((g) => {
    const m = g.match(/^\s*([^:]+):(.*)$/)
    return { label: m?.[1].trim(), tiles: (m ? m[2] : g).split(/\s+/).filter(Boolean) }
  }).filter((g) => g.tiles.length)
  return (
    <span className={cn('flex flex-wrap items-center gap-x-space-md gap-y-space-sm', className)} dir="rtl" lang="ar">
      {groups.map((g, gi) => (
        <span key={gi} className="flex flex-wrap items-center gap-1.5">
          {g.label && <span className="text-arabic-label text-secondary">{g.label}</span>}
          {g.tiles.map((l, i) => <LetterTile key={i} letter={l} className="min-h-12 min-w-11" />)}
        </span>
      ))}
      {note && <span className="text-arabic-label text-on-surface-variant">({note})</span>}
    </span>
  )
}
