import type { CSSProperties } from 'react'
import type { ColourKey } from '../core/types'
import { t } from '../i18n'
import { cn } from '@/lib/utils'

/** Muṣḥaf palette legend names (design §3.2). */
export const COLOURS: Record<ColourKey, { ar: string; en: string }> = {
  clear: { ar: 'إظهار', en: 'Clear' },
  ghunnah: { ar: 'غنة · إخفاء', en: 'Ghunnah' },
  silent: { ar: 'حرف لا يُنطق', en: 'Silent letter' },
  merge: { ar: 'إدغام', en: 'Merge' },
  madd2: { ar: 'مد حركتان', en: 'Madd 2' },
  madd45: { ar: 'مد ٤–٥', en: 'Madd 4–5' },
  madd246: { ar: 'مد ٢ أو ٤ أو ٦', en: 'Madd 2, 4 or 6' },
  madd6: { ar: 'مد ٦', en: 'Madd 6' },
  qalqalah: { ar: 'قلقلة', en: 'Qalqalah' },
  heavy: { ar: 'تفخيم', en: 'Heavy' },
  light: { ar: 'ترقيق', en: 'Light' },
}
export const COLOUR_KEYS = Object.keys(COLOURS) as ColourKey[]

export type { Level } from '../core/scheduler'

/* ---------- legend ---------- */
export interface LegendProps {
  colours: ColourKey[]
  isolate?: ColourKey | null
  /** Tap a chip to isolate that rule; tap again to clear (design §7.4 layer 2). */
  onIsolate?: (c: ColourKey | null) => void
  /** Rules not marked on this text yet: listed in plain ink, no dot. */
  notShown?: string[]
}

const chip = 'inline-flex min-h-12 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-3.5 text-arabic-label text-on-surface no-underline forced-colors:border-[CanvasText]'

function RuleChip({ c, selected, onClick }: { c: ColourKey; selected?: boolean; onClick?: () => void }) {
  const style = { '--rc': `var(--t-${c})` } as CSSProperties
  const inner = <><i aria-hidden="true" className="size-[9px] shrink-0 rounded-full bg-[var(--rc)]" /><span lang="ar">{COLOURS[c].ar}</span></>
  const cls = cn(chip, selected && 'border-2 border-[var(--rc)] px-[13px]')
  return onClick
    ? <button type="button" className={cn(cls, 'cursor-pointer')} style={style} onClick={onClick} aria-pressed={!!selected}>{inner}</button>
    : <span className={cls} style={style}>{inner}</span>
}

export function Legend({ colours, isolate, onIsolate, notShown }: LegendProps) {
  return (
    <div className="grid gap-space-sm">
      <div className="flex flex-wrap gap-1.5">
        {colours.map((c) => (
          <RuleChip key={c} c={c} selected={onIsolate ? isolate === c : undefined} onClick={onIsolate && (() => onIsolate(isolate === c ? null : c))} />
        ))}
      </div>
      {notShown?.length ? (
        <p className="text-body-md text-on-surface-variant">
          {t('Not shown here yet:')} <span lang="ar">{notShown.join('، ')}</span>
        </p>
      ) : null}
    </div>
  )
}

/* ---------- corrections ---------- */
/** Hue-free by design: جلي = filled ink pill ■, خفي = outlined □. */
export function CorrectionTag({ severity, gloss, count }: { severity: 'jali' | 'khafi'; gloss?: boolean; count?: number }) {
  const jali = severity === 'jali'
  return (
    <span className={cn('inline-flex min-h-7 items-center gap-1.5 rounded-full border border-on-surface px-2.5 text-label normal-case tracking-normal', jali ? 'bg-on-surface text-surface' : 'bg-surface text-on-surface')}>
      <span aria-hidden="true">{jali ? '■' : '□'}</span>
      {count != null && <span className="tabular-nums">{count}</span>}
      <span lang="ar" className="text-arabic-label font-bold">{jali ? 'جلي' : 'خفي'}</span>
      {gloss && <small className="text-caption">{jali ? t('clear error') : t('fine detail')}</small>}
    </span>
  )
}

export type DayMark = 'studied' | 'not' | 'future' | 'before'
