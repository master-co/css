import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "grid items-start [&>svg]:size-4 [&>svg]:text-current [&>svg]:translate-y-0.5 border gap-y-0.5 grid-cols-[0_1fr] has-[>svg]:gap-x-3 has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] px-4 py-3 relative rounded-lg text-sm w-full",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "[&>svg]:text-current *:data-[slot=alert-description]:text-destructive-foreground/80 text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
