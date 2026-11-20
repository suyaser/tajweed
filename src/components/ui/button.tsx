import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// DESIGN.md buttons: one primary per screen; secondary = hairline outline; tertiary = teal text.
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center no-underline justify-center gap-2 rounded-control text-body-md font-semibold whitespace-nowrap transition-colors select-none active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_[data-slot=icon]]:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary-fill text-on-primary hover:bg-primary-hover",
        secondary: "border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container",
        tertiary: "text-primary underline-offset-4 hover:underline",
        ghost: "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
        destructive: "bg-error text-on-error hover:opacity-90",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-11 px-4", // 44px: still a touch target
        lg: "h-[52px] px-6 text-body-lg",
        icon: "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }

// forwardRef: React 18 (Radix `asChild` triggers pass a ref to their child).
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "default", asChild = false, type, ...props },
  ref
) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={asChild ? type : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

export { Button, buttonVariants, type ButtonProps }
