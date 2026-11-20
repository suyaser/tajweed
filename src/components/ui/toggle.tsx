import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Toggle as TogglePrimitive } from "radix-ui"

const toggleVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-control text-body-md font-medium whitespace-nowrap transition-[color,box-shadow] text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=on]:bg-primary-container data-[state=on]:text-on-primary-container [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-outline-variant bg-transparent data-[state=on]:border-primary/25",
      },
      size: {
        default: "h-12 min-w-12 px-3",
        sm: "h-10 min-w-10 px-2.5",
        lg: "h-14 min-w-14 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>>(function Toggle(
  { className, variant, size, ...props },
  ref
) {
  return (
    <TogglePrimitive.Root
      ref={ref}
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
})

export { Toggle, toggleVariants }
