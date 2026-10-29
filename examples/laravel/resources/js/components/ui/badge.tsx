import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "display:inline-flex align-items:center justify-content:center text-xs font-medium aria-invalid:ring-destructive/20 focus-visible:ring-ring/50 dark:aria-invalid:ring-destructive/40 focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3 border gap-1 overflow-auto px-2 py-0.5 rounded-md shrink-0 transition-[color,box-shadow] w-fit whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-primary [a&]:hover:bg-primary/90 border-transparent text-primary-foreground",
        secondary:
          "[a&]:hover:bg-secondary/90 bg-secondary border-transparent text-secondary-foreground",
        destructive:
          "focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90 bg-destructive border-transparent text-white",
        outline:
          "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
