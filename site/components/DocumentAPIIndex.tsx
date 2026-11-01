import '~/site/styles/system/data.css'
import Link from '~/site/docs-shell/components/Link'
import DocumentIdentifier from './DocumentIdentifier'

export interface DocumentAPIEntry {
  name: string
  href: string
  description: string
}

/** Static navigation for exact identifiers; long names wrap without changing copy text. */
export default function DocumentAPIIndex({ label, entries, compact = false }: { label: string, entries: readonly DocumentAPIEntry[], compact?: boolean }) {
  return <nav className="ui-index" data-density={compact ? 'compact' : undefined} aria-label={label}>
    {entries.map(entry => <Link key={entry.href} href={entry.href}>
      <b><code><DocumentIdentifier>{entry.name}</DocumentIdentifier></code></b>
      <span>{entry.description}</span>
    </Link>)}
  </nav>
}
