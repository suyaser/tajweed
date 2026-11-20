// Small pieces shared by the Teacher, TeacherNew and Session screens.
import type { ReactNode } from 'react'
import { getSnapshot } from '../../core/store'
import { REASON } from '../path/ui'
import type { Planned } from '../path/helpers'
import { digits } from '../../i18n'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

const REASON_ICON: Record<Planned['reason'], string> = { milestone: 'star', correction: 'replay', recent: 'history', ask: 'add' }

/** Hue-free by design: جلي = filled ink pill, خفي = outlined. */
export function SeverityTag({ severity, count }: { severity: 'jali' | 'khafi'; count?: number }) {
  const jali = severity === 'jali'
  return (
    <span className={cn('inline-flex h-7 shrink-0 items-center gap-1 rounded-control border px-2.5 text-label font-semibold',
      jali ? 'border-on-surface bg-on-surface text-surface' : 'border-outline text-on-surface')}>
      {count != null && <span>{digits(count)}</span>}
      <span lang="ar" className="font-arabic">{jali ? 'جلي' : 'خفي'}</span>
    </span>
  )
}

/** Why a passage is in the plan (finale, re-check, since last time, added by you), with the open correction's severity. */
export function ReasonTag({ p }: { p: Planned }) {
  const open = p.reason === 'correction' ? getSnapshot().corrections.find((c) => !c.deletedAt && c.status === 'open' && c.verseKey === p.from) : undefined
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={cn('inline-flex h-7 items-center gap-1 rounded-control px-2.5 text-label',
        p.reason === 'milestone' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant')}>
        <Icon name={REASON_ICON[p.reason]} size={16} fill={p.reason === 'milestone'} />{REASON[p.reason].label}
      </span>
      {open && <SeverityTag severity={open.severity} />}
    </span>
  )
}

/** A list row: main content, then trailing content. */
export function Item({ children, end, className }: { children: ReactNode; end?: ReactNode; className?: string }) {
  return (
    <li className={cn('flex flex-wrap items-center gap-x-space-md gap-y-space-xs px-space-md py-space-sm', className)}>
      <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">{children}</div>
      {end}
    </li>
  )
}

/** A verse reference as a big Arabic link / label. */
export const refCls = 'font-naskh text-[20px] leading-[1.6] font-semibold text-on-surface no-underline hover:text-primary'
