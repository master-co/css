import '~/site/styles/documentation-values.css'
import Link from '~/site/docs-shell/components/Link'
import { IconArrowUpRight } from '@tabler/icons-react'
import DocumentIdentifier from './DocumentIdentifier'

export interface DocumentAPIEntry {
  name: string
  href: string
  description: string
}

/** Static navigation for exact identifiers; long names wrap without changing copy text. */
export default function DocumentAPIIndex({ label, entries, compact = false }: { label: string, entries: readonly DocumentAPIEntry[], compact?: boolean }) {
  return <nav className="doc-api-index" data-compact={compact || undefined} aria-label={label}>
    <ul>{entries.map(entry => <li key={entry.href}>
      <Link href={entry.href}>
        <span className="doc-api-index-copy"><code><DocumentIdentifier>{entry.name}</DocumentIdentifier></code><span>{entry.description}</span></span>
        <IconArrowUpRight size={16} stroke={1.5} aria-hidden="true" />
      </Link>
    </li>)}</ul>
  </nav>
}
