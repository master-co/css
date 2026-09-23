import { createElement } from 'react'

export interface DocumentValueRow {
  id: string
  title: string
  identifier?: string
  values: { label: string, value: string }[]
}

/** Compact, selectable reference facts. IDs belong to the visible row headings. */
export function DocumentValueList({ rows, headingLevel = 3 }: { rows: DocumentValueRow[], headingLevel?: 3 | 4 }) {
  return <dl className="doc-values">
    {rows.map(row => <div className="doc-value-row" key={row.id}>
      <dt>
        {createElement(`h${headingLevel}`, { id: row.id, className: 'doc-value-title' }, <a href={`#${row.id}`}>{row.title}</a>)}
        {row.identifier && <code className="doc-value-identifier">{row.identifier}</code>}
      </dt>
      <dd>{row.values.map(({ label, value }) => <div className="doc-value-pair" key={label}>
        <span className="doc-value-label">{label}</span><code>{value}</code>
      </div>)}</dd>
    </div>)}
  </dl>
}

/** Keep complete utility keys together when a consumer list wraps. */
export function DocumentKeyList({ keys, previewCount = keys.length }: { keys: string[], previewCount?: number }) {
  const list = (values: string[]) => <ul className="doc-key-list" aria-label="Utility keys">
    {values.map(key => <li key={key}><code>{key}</code></li>)}
  </ul>
  return <>
    {list(keys.slice(0, previewCount))}
    {/* Preserve a native disclosure opened before this streamed document hydrates. */}
    {keys.length > previewCount && <details className="doc-key-more" suppressHydrationWarning>
      <summary>Show {keys.length - previewCount} more keys</summary>
      {list(keys.slice(previewCount))}
    </details>}
  </>
}

/** Native disclosure keeps large registry rows readable; every key remains in the HTML. */
export function DocumentNamespaceTable({ rows }: { rows: { namespace: string, consumers: string[] }[] }) {
  return <div className="doc-table doc-namespace-table"><table>
    <thead><tr><th>Namespace</th><th>Consumers</th></tr></thead>
    <tbody>{rows.map(({ namespace, consumers }) => <tr key={namespace}>
      <th scope="row"><code>{namespace}-*</code></th>
      <td><DocumentKeyList keys={consumers} previewCount={6} /></td>
    </tr>)}</tbody>
  </table></div>
}

/** Preserve short syntax tokens while allowing native CSS to wrap at its spaces. */
export function DocumentCodeTable({ label = 'Syntax', rows }: { label?: string, rows: { syntax: string, css: string }[] }) {
  return <div className="doc-table doc-code-table"><table>
    <thead><tr><th scope="col">{label}</th><th scope="col">CSS</th></tr></thead>
    <tbody>{rows.map(({ syntax, css }) => <tr key={syntax}>
      <th scope="row"><code>{syntax}</code></th><td><code>{css}</code></td>
    </tr>)}</tbody>
  </table></div>
}
