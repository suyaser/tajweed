import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export interface IconProps {
  /** Material Symbols Outlined ligature name, e.g. "headphones", "arrow_forward". */
  name: string
  /** Pixel size of the glyph box (default 24). */
  size?: number
  /** Filled variant (current/active states). */
  fill?: boolean
  /** Mirror in RTL: arrows, chevrons, anything pointing along the reading direction. */
  rtlFlip?: boolean
  className?: string
  style?: CSSProperties
}

/** Decorative icon (aria-hidden). Give the control around it an accessible name. */
export function Icon({ name, size = 24, fill = false, rtlFlip = false, className, style }: IconProps) {
  return (
    <span
      aria-hidden
      data-slot="icon"
      className={cn('ms-icon', rtlFlip && 'rtl:-scale-x-100', className)}
      style={{ fontSize: size, width: size, height: size, ...(fill && { '--icon-fill': 1 }), ...style } as CSSProperties}
    >
      {name}
    </span>
  )
}
