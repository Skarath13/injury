'use client'

import * as React from 'react'
import { Info } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface InfoIconProps {
  content: React.ReactNode
  className?: string
  label?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

export default function InfoIcon({
  content,
  className,
  label = 'More information',
  side = 'top',
  align = 'center'
}: InfoIconProps) {
  const [open, setOpen] = React.useState(false)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    setOpen((currentOpen) => !currentOpen)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onKeyDown={handleKeyDown}
          className={cn(
            'inline-flex size-10 shrink-0 touch-manipulation items-center justify-center rounded-full text-sky-700 outline-none transition-[background-color,color,box-shadow,transform]',
            'hover:bg-sky-50 hover:text-sky-800 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95',
            className
          )}
        >
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm ring-1 ring-sky-500/30">
            <Info className="size-4" aria-hidden="true" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        collisionPadding={16}
        className="w-[min(20rem,calc(100vw-2rem))] p-3 text-sm leading-5 text-popover-foreground"
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}
