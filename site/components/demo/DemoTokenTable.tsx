import '~/site/styles/system/data.css'
import type { ReactNode } from 'react'
import InlineCode from '~/site/docs-shell/components/InlineCode'

export interface DemoTokenRow {
  token: string
  utilities: string[]
  value?: string
  description: ReactNode
  preview?: ReactNode
}

/** A document inventory, separate from any specimen's measured layout. */
export default function DemoTokenTable({ rows, descriptionTitle = 'Role' }: { rows: DemoTokenRow[], descriptionTitle?: string }) {
  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Narrow token inventories need native keyboard scrolling.
  return <div className="ui-table" role="region" aria-label={`${descriptionTitle} token table`} tabIndex={0}><table>
    <thead><tr><th scope="col">Token / class</th><th scope="col" className="(min-width:12rem)">{descriptionTitle}</th></tr></thead>
    <tbody>{rows.map(({ token, utilities, value, description, preview }) => <tr key={token}>
      <td>
        <div className="whitespace-nowrap">{preview}<code>{token}</code></div>
        {utilities.length > 0 && <div className="flex flex-wrap gap-xs mt-xs">{utilities.map(utility => <InlineCode key={utility} className="whitespace-nowrap">{utility}</InlineCode>)}</div>}
      </td>
      <td>{value && <div className="mb-xs"><code>{value}</code></div>}{description}</td>
    </tr>)}</tbody>
  </table></div>
}
