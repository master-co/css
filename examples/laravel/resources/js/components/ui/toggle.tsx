import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "display:inline-flex align-items:center justify-content:center outline-style:none text-sm font-medium aria-invalid:ring-destructive/20 disabled:pointer-events-none focus-visible:ring-ring/50 hover:text-muted-foreground dark:aria-invalid:ring-destructive/40 focus-visible:ring-[3px] [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground gap-2 rounded-md transition-[color,box-shadow]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "shadow-xs hover:text-accent-foreground bg-transparent border border-input",
      },
      size: {
        default: "h-9 min-w-9 px-2",
        sm: "h-8 min-w-8 px-1.5",
        lg: "h-10 min-w-10 px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
