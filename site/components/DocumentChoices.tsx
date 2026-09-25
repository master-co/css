import '~/site/styles/documentation-index.css'
import type { ReactNode } from 'react'
import Link from '~/site/docs-shell/components/Link'
import { IconArrowRight } from '@tabler/icons-react'

export interface DocumentChoice {
  title: string
  description: string
  href: string
  icon?: ReactNode
}

/** A compact reading-column index. Navigation stays outside measured demo layouts. */
export default function DocumentChoices({ label, entries }: { label: string; entries: readonly DocumentChoice[] }) {
  return <nav aria-label={label} className="doc-choices">
    <ul>
      {entries.map(entry => <li key={entry.href}>
        <Link href={entry.href}>
          {entry.icon && <span className="doc-choice-icon" aria-hidden="true">{entry.icon}</span>}
          <span className="doc-choice-copy">
            <span className="doc-choice-title">{entry.title}</span>
            <span className="doc-choice-description">{entry.description}</span>
          </span>
          <IconArrowRight size={16} stroke={1.5} aria-hidden="true" />
        </Link>
      </li>)}
    </ul>
  </nav>
}
