import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center [&>svg]:pointer-events-none [&>svg]:size-3 aria-invalid:border-destructive aria-invalid:ring-destructive/20 border dark:aria-invalid:ring-destructive/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 font-medium gap-1 overflow-auto px-2 py-0.5 rounded-md shrink-0 text-xs transition-[color,box-shadow] w-fit whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "[a&]:hover:bg-primary/90 bg-primary border-transparent text-primary-foreground",
        secondary:
          "[a&]:hover:bg-secondary/90 bg-secondary border-transparent text-secondary-foreground",
        destructive:
          "[a&]:hover:bg-destructive/90 bg-destructive border-transparent dark:focus-visible:ring-destructive/40 focus-visible:ring-destructive/20 text-white",
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
