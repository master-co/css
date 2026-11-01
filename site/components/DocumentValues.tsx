import '~/site/styles/system/data.css'
import { createElement } from 'react'

export interface DocumentValueRow {
  id: string
  title: string
  identifier?: string
  values: { label: string, value: string }[]
}

/** Compact, selectable reference facts. IDs belong to the visible row headings. */
export function DocumentValueList({ rows, headingLevel = 3 }: { rows: DocumentValueRow[], headingLevel?: 3 | 4 }) {
  return <dl className="ui-params">
    {rows.map(row => <div key={row.id}>
      <dt>
        {createElement(`h${headingLevel}`, { id: row.id }, <a href={`#${row.id}`}>{row.title}</a>)}
        {row.identifier && <small>{row.identifier}</small>}
      </dt>
      <dd>{row.values.map(({ label, value }) => <p key={label}><small>{label}</small> <code>{value}</code></p>)}</dd>
    </div>)}
  </dl>
}

/** Keep complete utility keys together when a consumer list wraps. */
export function DocumentKeyList({ keys, previewCount = keys.length }: { keys: string[], previewCount?: number }) {
  const list = (values: string[]) => <ul aria-label="Utility keys">
    {values.map(key => <li key={key}><code>{key}</code></li>)}
  </ul>
  return <>
    {list(keys.slice(0, previewCount))}
    {/* Preserve a native disclosure opened before this streamed document hydrates. */}
    {keys.length > previewCount && <details className="ui-disclosure" suppressHydrationWarning>
      <summary>Show {keys.length - previewCount} more keys</summary>
      {list(keys.slice(previewCount))}
    </details>}
  </>
}

/** Native disclosure keeps large registry rows readable; every key remains in the HTML. */
export function DocumentNamespaceTable({ rows }: { rows: { namespace: string, consumers: string[] }[] }) {
  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The table's narrow overflow region must be focusable for native keyboard scrolling.
  return <div className="ui-table" data-variant="lookup" role="region" aria-label="Namespace consumers" tabIndex={0}><table>
    <thead><tr><th scope="col">Namespace</th><th scope="col">Consumers</th></tr></thead>
    <tbody>{rows.map(({ namespace, consumers }) => <tr key={namespace}>
      <th scope="row"><code>{namespace}-*</code></th>
      <td><DocumentKeyList keys={consumers} previewCount={6} /></td>
    </tr>)}</tbody>
  </table></div>
}

/** Preserve short syntax tokens while allowing native CSS to wrap at its spaces. */
export function DocumentCodeTable({ label = 'Syntax', rows }: { label?: string, rows: { syntax: string, css: string }[] }) {
  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The table's narrow overflow region must be focusable for native keyboard scrolling.
  return <div className="ui-table" data-variant="lookup" role="region" aria-label={`${label} and CSS`} tabIndex={0}><table>
    <thead><tr><th scope="col">{label}</th><th scope="col">CSS</th></tr></thead>
    <tbody>{rows.map(({ syntax, css }) => <tr key={syntax}>
      <th scope="row"><code>{syntax}</code></th><td><code>{css}</code></td>
    </tr>)}</tbody>
  </table></div>
}
