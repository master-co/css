import '~/site/styles/demo-colors.css'
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
  return <figure><div className="doc-table" role="region" aria-label={`${descriptionTitle} token table`} tabIndex={0}><table>
    <thead><tr><th scope="col">Token / class</th><th scope="col" className="min-width:12rem">{descriptionTitle}</th></tr></thead>
    <tbody>{rows.map(({ token, utilities, value, description, preview }) => <tr key={token}>
      <td>
        <div className="white-space:nowrap">{preview}<InlineCode className="white-space:nowrap">{token}</InlineCode></div>
        <div className="display:flex flex-wrap:wrap gap-xs mt-xs">{utilities.map(utility => <InlineCode key={utility} className="white-space:nowrap">{utility}</InlineCode>)}</div>
      </td>
      <td>{value && <div className="mb-xs"><InlineCode>{value}</InlineCode></div>}{description}</td>
    </tr>)}</tbody>
  </table></div></figure>
}
