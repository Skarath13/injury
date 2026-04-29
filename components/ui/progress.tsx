"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  indicatorClassName,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
}) {
  const progressValue = Math.max(0, Math.min(Number(value) || 0, 100))

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "size-full flex-1 bg-primary transition-transform duration-300 ease-out will-change-transform",
          indicatorClassName
        )}
        style={{ transform: `translate3d(-${100 - progressValue}%, 0, 0)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
