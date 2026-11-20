import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// DESIGN.md chips & metadata badges: 28px tall, 12px text, 14px radius.
const badgeVariants = cva(
  "inline-flex h-7 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-control border border-transparent px-3 text-label whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-surface-container text-on-surface-variant",
        primary: "border-primary/25 bg-primary-container text-on-primary-container",
        secondary: "bg-secondary-container text-on-secondary-container",
        success: "bg-success-container text-on-success-container",
        destructive: "bg-error-container text-on-error-container",
        outline: "border-outline-variant text-on-surface-variant",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Badge = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }>(function Badge(
  { className, variant = "default", asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      ref={ref}
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
})

export { Badge, badgeVariants }
