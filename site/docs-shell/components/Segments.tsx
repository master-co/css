'use client'

import '~/site/styles/docs-shell/segments.css'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

interface Segment {
  name: string
  content: ReactNode
}

/** Related document views stay available in the HTML, including without scripting. */
export default function Segments({ children: segments, label = 'Document view' }: { children: readonly Segment[]; label?: string }) {
  const prefix = useId()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const [activeName, setActiveName] = useState(segments[0]?.name)
  const activeIndex = Math.max(0, segments.findIndex(segment => segment.name === activeName))

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? segments.length - 1
      : event.key === 'ArrowRight' ? (index + 1) % segments.length
        : event.key === 'ArrowLeft' ? (index - 1 + segments.length) % segments.length : undefined
    if (next === undefined) return
    event.preventDefault()
    setActiveName(segments[next].name)
    buttons.current[next]?.focus()
  }

  if (!segments.length) return null
  return (
    <div className="segment-views">
      <div className="segments" role="tablist" aria-label={label}>
        {segments.map((segment, index) => <button key={segment.name}
          ref={element => { buttons.current[index] = element }}
          type="button"
          id={`${prefix}-tab-${index}`}
          role="tab"
          aria-controls={`${prefix}-panel-${index}`}
          aria-selected={activeIndex === index}
          tabIndex={activeIndex === index ? 0 : -1}
          onClick={() => setActiveName(segment.name)}
          onKeyDown={event => navigate(event, index)}
          className="segment">
          {segment.name}
        </button>)}
      </div>
      {segments.map((segment, index) =>
        <div key={segment.name} className="segment-panel"
          id={`${prefix}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${prefix}-tab-${index}`}
          tabIndex={0}
          hidden={activeIndex !== index}>
          <div className="segment-panel-label">{segment.name}</div>
          {segment.content}
        </div>
      )}
    </div>
  )
}
