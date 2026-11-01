import '~/site/styles/system/data.css'
import type { ReactNode } from 'react'
import Link from '~/site/docs-shell/components/Link'

export interface DocumentChoice {
  title: string
  description: string
  href: string
  icon?: ReactNode
}

/** A compact reading-column index. Navigation stays outside measured demo layouts. */
export default function DocumentChoices({ label, entries }: { label: string; entries: readonly DocumentChoice[] }) {
  return <nav aria-label={label} className="ui-index">
    {entries.map(entry => <Link key={entry.href} href={entry.href}>
      {entry.icon}
      <b>{entry.title}</b>
      <span>{entry.description}</span>
    </Link>)}
  </nav>
}
