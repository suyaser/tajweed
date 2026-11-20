import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const CHIP = {
  neutral: 'bg-surface-container text-on-surface-variant',
  primary: 'border-primary/25 bg-primary-container text-on-primary-container',
  gold: 'bg-secondary-container text-on-secondary-container',
  success: 'bg-success-container text-on-success-container',
  error: 'bg-error-container text-on-error-container',
  outline: 'border-outline-variant text-on-surface-variant',
} as const
export type ChipTone = keyof typeof CHIP

/**
 * 28px pill: metadata (reference, makhraj), or a 44px toggle when `onClick` is given (`pressed` → aria-pressed).
 */
export function Chip({ tone = 'neutral', icon, fill, pressed, onClick, children, className, label }: {
  tone?: ChipTone; icon?: string; fill?: boolean; pressed?: boolean; onClick?: () => void; children?: ReactNode; className?: string
  /** Accessible name when the chip has only an icon. */
  label?: string
}) {
  const cls = cn(
    'relative inline-flex h-7 shrink-0 items-center gap-1 rounded-control border border-transparent px-3 text-label whitespace-nowrap',
    !children && 'w-7 justify-center px-0',
    CHIP[pressed ? 'primary' : tone],
    className,
  )
  const body = <>{icon && <Icon name={icon} size={16} fill={fill ?? pressed} />}{children}</>
  if (!onClick) return <span className={cls}>{body}</span>
  return (
    <button type="button" aria-pressed={pressed} aria-label={label} onClick={onClick}
      className={cn(cls, 'h-11 min-w-11 cursor-pointer px-3.5 transition-colors hover:brightness-95', !children && 'w-11 px-0', pressed === false && 'border-outline-variant bg-surface-container-lowest')}>
      {body}
    </button>
  )
}

const STATUS = {
  done: { tone: 'success', icon: 'check_circle' },
  current: { tone: 'gold', icon: 'radio_button_checked' },
  info: { tone: 'primary', icon: 'info' },
  todo: { tone: 'neutral', icon: 'radio_button_unchecked' },
  warning: { tone: 'error', icon: 'error' },
} as const satisfies Record<string, { tone: ChipTone; icon: string }>

/** Status pill with its icon (done / current / info / todo / warning). Text is the caller's (already translated). */
export function StatusChip({ status, children, className }: { status: keyof typeof STATUS; children: ReactNode; className?: string }) {
  const s = STATUS[status]
  return <Chip tone={s.tone} icon={s.icon} fill={status === 'done'} className={className}>{children}</Chip>
}

/** Two to four mutually exclusive views (List / Map). Radix ToggleGroup: arrow keys, RTL aware. */
export function SegmentedControl<V extends string>({ value, onChange, options, label, className }: {
  value: V; onChange: (v: V) => void; options: { value: V; label: ReactNode; icon?: string }[]; label: string; className?: string
}) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as V)} aria-label={label} spacing={1}
      className={cn('h-12 rounded-control bg-surface-container p-1', className)}>
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value}
          className="h-10 min-w-20 flex-1 rounded-[10px] px-space-md data-[state=on]:bg-surface-container-lowest data-[state=on]:font-semibold data-[state=on]:text-on-surface data-[state=on]:shadow-card">
          {o.icon && <Icon name={o.icon} size={18} />}{o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
