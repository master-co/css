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
      <div>
        {entry.children ? <IconFolder stroke={1.6} aria-hidden="true" /> : <IconFile stroke={1.6} aria-hidden="true" />}
        <b>{entry.name}{entry.children ? '/' : ''}</b>
        {entry.description && <span>{entry.description}</span>}
      </div>
      {!!entry.children?.length && <Entries entries={entry.children} />}
    </li>)}
  </ul>
}

/** Read-only nested lists; no tree widget or keyboard interaction is implied. */
export default function DocumentFileTree({ title, entries, caption }: DocumentFileTreeProps) {
  return <figure className="ui-tray" aria-label={title}>
    <figcaption className="ui-tray-head"><p className="ui-tray-title">{title}</p></figcaption>
    <div className="ui-tree"><Entries entries={entries} /></div>
    {caption && <p className="ui-tray-caption">{caption}</p>}
  </figure>
}
