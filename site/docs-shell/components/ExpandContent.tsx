'use client'

import { IconChevronDown } from '@tabler/icons-react'
import { useId, useState } from 'react'
import { useTranslation } from '../contexts/i18n'

/** A long surface clamped under a canvas fade; one quiet control shows the rest. */
export default function ExpandContent({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const $ = useTranslation()
  return (
    <div className="ui-expand" data-expanded={expanded}>
      <div id={id}>{children}</div>
      <div className="ui-expand-control">
        <button type="button" className="ui-button" data-size="sm" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>
          {$(expanded ? 'Collapse' : 'Expand')}
          <IconChevronDown aria-hidden="true" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
