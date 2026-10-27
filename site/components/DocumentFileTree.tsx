import '~/site/styles/documentation-index.css'
import { IconFile, IconFolder } from '@tabler/icons-react'

export interface DocumentFileEntry {
  name: string
  description?: string
  children?: readonly DocumentFileEntry[]
}

export interface DocumentFileTreeProps {
  title: string
  entries: readonly DocumentFileEntry[]
  caption?: string
}

function Entries({ entries }: { entries: readonly DocumentFileEntry[] }) {
  // eslint-disable-next-line jsx-a11y/no-redundant-roles -- Preserve WebKit list semantics when list-style is none.
  return <ul role="list">
    {entries.map(entry => <li key={entry.name}>
      <div className="doc-file-row">
        {entry.children ? <IconFolder size={16} stroke={1.5} aria-hidden="true" /> : <IconFile size={16} stroke={1.5} aria-hidden="true" />}
        <span className="doc-file-copy"><span className="doc-file-name">{entry.name}{entry.children ? '/' : ''}</span>{entry.description && <span className="doc-file-description">{entry.description}</span>}</span>
      </div>
      {!!entry.children?.length && <Entries entries={entry.children} />}
    </li>)}
  </ul>
}

/** Read-only nested lists; no tree widget or keyboard interaction is implied. */
export default function DocumentFileTree({ title, entries, caption }: DocumentFileTreeProps) {
  return <figure className="doc-file-tree" aria-label={title}>
    <figcaption>{title}</figcaption>
    <div className="doc-file-entries"><Entries entries={entries} /></div>
    {caption && <p className="doc-file-caption">{caption}</p>}
  </figure>
}
