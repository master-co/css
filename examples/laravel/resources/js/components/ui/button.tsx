import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center outline-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 disabled:opacity-50 disabled:pointer-events-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 font-medium gap-2 rounded-md text-sm transition-[color,box-shadow] whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-primary hover:bg-primary/90 shadow-xs text-primary-foreground",
        destructive:
          "bg-destructive dark:focus-visible:ring-destructive/40 focus-visible:ring-destructive/20 hover:bg-destructive/90 shadow-xs text-white",
        outline:
          "bg-background border border-input hover:bg-accent hover:text-accent-foreground shadow-xs",
        secondary:
          "bg-secondary hover:bg-secondary/80 shadow-xs text-secondary-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
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
