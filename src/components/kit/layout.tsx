import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { digits, isAr } from '@/i18n'
import { Icon } from '@/components/ui/icon'

/** Screen body: centred column, gutters (safe-area aware), vertical rhythm between children. */
export function Page({ children, width = 'default', className }: { children: ReactNode; width?: 'default' | 'narrow' | 'wide'; className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-space-lg py-space-lg',
        'ps-[max(var(--spacing-gutter),env(safe-area-inset-left))] pe-[max(var(--spacing-gutter),env(safe-area-inset-right))] md:px-gutter-md',
        { narrow: 'max-w-[680px]', default: 'max-w-[760px]', wide: 'max-w-[960px]' }[width],
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Screen title. Arabic UI shows `ar` only; English UI shows `en` with the Arabic beside it in naskh. */
export function PageHeader({ en, ar, eyebrow, subtitle, actions, className }: {
  en: string; ar?: string; eyebrow?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string
}) {
  return (
    <header className={cn('flex items-start justify-between gap-space-md', className)}>
      <div className="flex min-w-0 flex-col gap-space-xs">
        {eyebrow && <span className="text-label text-secondary uppercase rtl:normal-case">{eyebrow}</span>}
        <h1 className="flex flex-wrap items-baseline gap-x-space-sm">
          {isAr ? (
            <span className="text-arabic-headline text-on-surface">{ar ?? en}</span>
          ) : (
            <>
              <span className="text-headline-lg text-on-surface">{en}</span>
              {ar && <span lang="ar" dir="rtl" className="text-arabic-headline font-semibold text-primary">{ar}</span>}
            </>
          )}
        </h1>
        {subtitle && <p className="text-body-md text-on-surface-variant">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-space-xs">{actions}</div>}
    </header>
  )
}

/**
 * Numbered content card. EN UI: number · English label at the start, Arabic label at the end.
 * AR UI: number · Arabic label only.
 */
export function SectionCard({ n, en, ar, children, className }: { n?: number | string; en: string; ar?: string; children: ReactNode; className?: string }) {
  const num = n == null ? null : digits(n)
  return (
    <section className={cn('rounded-card border border-outline-variant bg-surface-container-lowest p-space-md sm:p-space-lg', className)}>
      <h2 className="mb-space-sm flex items-center justify-between gap-space-sm">
        <span className="flex min-w-0 items-center gap-space-sm">
          {num != null && (
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-container text-label font-bold text-primary">{num}</span>
          )}
          <span className="text-label font-semibold tracking-wider text-on-surface-variant uppercase rtl:normal-case">{isAr ? ar ?? en : en}</span>
        </span>
        {!isAr && ar && <span lang="ar" dir="rtl" className="text-arabic-label text-secondary">{ar}</span>}
      </h2>
      <div className="text-body-md text-on-surface">{children}</div>
    </section>
  )
}

const CALLOUT = {
  'listen-for': { icon: 'hearing', box: 'bg-secondary-container/60', badge: 'bg-secondary-container text-on-secondary-container' },
  tip: { icon: 'lightbulb', box: 'bg-primary-container/60', badge: 'bg-primary-container text-on-primary-container' },
  note: { icon: 'info', box: 'bg-surface-container', badge: 'bg-surface-container-high text-on-surface-variant' },
} as const

/** Annotation box with a 2px gold edge on the inline start. `title` is a short label ("Listen for"). */
export function Callout({ variant = 'note', title, icon, children, className }: {
  variant?: keyof typeof CALLOUT; title?: ReactNode; icon?: string; children: ReactNode; className?: string
}) {
  const v = CALLOUT[variant]
  return (
    <aside className={cn('flex items-start gap-space-sm rounded-e-card rounded-s-sm border-s-2 border-gold p-space-md', v.box, className)}>
      <span className={cn('grid size-7 shrink-0 place-items-center rounded-full', v.badge)}><Icon name={icon ?? v.icon} size={16} /></span>
      <div className="flex min-w-0 flex-col gap-0.5">
        {title && <span className="text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">{title}</span>}
        <div className="text-body-md text-on-surface">{children}</div>
      </div>
    </aside>
  )
}

/** Nothing-here state: icon, title, optional body and one action. */
export function EmptyState({ icon = 'inbox', title, children, action, className }: {
  icon?: string; title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-space-sm rounded-card border border-dashed border-outline-variant px-space-lg py-space-xl text-center', className)}>
      <span className="grid size-12 place-items-center rounded-full bg-surface-container text-on-surface-variant"><Icon name={icon} /></span>
      <p className="text-headline-md text-on-surface">{title}</p>
      {children && <div className="max-w-[40ch] text-body-md text-on-surface-variant">{children}</div>}
      {action && <div className="mt-space-sm">{action}</div>}
    </div>
  )
}

/**
 * Sticky bottom action bar (the screen's one primary action). Phone: pinned to the bottom with the safe area;
 * ≥ lg: sits inline at the end of the content. Leave room under the content with `pb-28` on phones.
 */
export function BottomBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-40 -mx-gutter flex flex-col gap-space-sm bg-surface/90 px-gutter pt-space-sm shadow-bar backdrop-blur-md',
        'pb-[max(var(--spacing-space-sm),env(safe-area-inset-bottom))] lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:shadow-none lg:backdrop-blur-none',
        '[&>[data-slot=button]]:w-full',
        className,
      )}
    >
      {children}
    </div>
  )
}
