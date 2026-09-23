import type { ReactNode } from 'react'
import InlineCode from '~/internal/components/InlineCode'

export interface DemoTokenRow {
  token: string
  utilities: string[]
  value?: string
  description: ReactNode
  preview?: ReactNode
}

/** A document inventory, separate from any specimen's measured layout. */
export default function DemoTokenTable({ rows, descriptionTitle = 'Role' }: { rows: DemoTokenRow[], descriptionTitle?: string }) {
  return <figure><div className="doc-table"><table>
    <thead><tr><th scope="col">Token / class</th><th scope="col" className="min-w:12rem">{descriptionTitle}</th></tr></thead>
    <tbody>{rows.map(({ token, utilities, value, description, preview }) => <tr key={token}>
      <td>
        <div className="white-space:nowrap">{preview}<InlineCode className="white-space:nowrap">{token}</InlineCode></div>
        <div className="flex flex-wrap gap:xs mt:xs">{utilities.map(utility => <InlineCode key={utility} className="white-space:nowrap">{utility}</InlineCode>)}</div>
      </td>
      <td>{value && <div className="mb:xs"><InlineCode>{value}</InlineCode></div>}{description}</td>
    </tr>)}</tbody>
  </table></div></figure>
}
