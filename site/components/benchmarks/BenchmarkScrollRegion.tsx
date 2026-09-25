'use client'

import '~/site/styles/benchmarks.css'
import { useId, type KeyboardEvent, type ReactNode } from 'react'

/** Mobile WebKit does not consistently scroll a focused div with arrow keys. */
function scrollWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
  if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const region = event.currentTarget
  const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
  const vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown'
  if (!horizontal && !vertical) return
  if (horizontal ? region.scrollWidth <= region.clientWidth : region.scrollHeight <= region.clientHeight) return
  const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -40 : 40
  event.preventDefault()
  region.scrollBy({ left: horizontal ? step : 0, top: vertical ? step : 0, behavior: 'instant' })
}

export default function BenchmarkScrollRegion({ title, children }: { title: string; children: ReactNode }) {
  const descriptionId = useId()
  return (
    // Scroll regions need a tab stop; arrow keys operate this region without intercepting children.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions
    <div className="benchmark-table-scroll" role="region" aria-label={title} aria-describedby={descriptionId} tabIndex={0} onKeyDown={scrollWithKeyboard}>
      <span className="sr-only" id={descriptionId}>Use arrow keys to scroll the table.</span>
      {children}
    </div>
  )
}
