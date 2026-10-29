import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "display:inline-flex align-items:center justify-content:center outline-style:none text-sm font-medium aria-invalid:ring-destructive/20 disabled:pointer-events-none focus-visible:ring-ring/50 dark:aria-invalid:ring-destructive/40 focus-visible:ring-[3px] [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 gap-2 rounded-md transition-[color,box-shadow] whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-primary shadow-xs hover:bg-primary/90 text-primary-foreground",
        destructive:
          "shadow-xs focus-visible:ring-destructive/20 hover:bg-destructive/90 dark:focus-visible:ring-destructive/40 bg-destructive text-white",
        outline:
          "shadow-xs hover:text-accent-foreground bg-background border border-input",
        secondary:
          "shadow-xs hover:bg-secondary/80 bg-secondary text-secondary-foreground",
        ghost: "hover:text-accent-foreground",
        link: "hover:underline text-primary underline-offset-4",
      },
      size: {
        default: "h-9 has-[>svg]:px-3 px-4 py-2",
        sm: "h-8 has-[>svg]:px-2.5 px-3 rounded-md",
        lg: "h-10 has-[>svg]:px-4 px-6 rounded-md",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
