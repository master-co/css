import InlineCode from '~/site/docs-shell/components/InlineCode'
import { getAnimationRows } from './animation-data'

export function AnimationTokenTable() {
  const rows = getAnimationRows()

  return (
    <figure>
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Class</th>
              <th>Role / Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ token, utilities, value, description }) => (
              <tr key={token}>
                <td className="white-space:nowrap">
                  <InlineCode className="white-space:nowrap">{token}</InlineCode>
                </td>
                <td>
                  <InlineCode className="white-space:nowrap">{utilities[0]}</InlineCode>
                </td>
                <td>
                  <InlineCode className="white-space:nowrap">{value}</InlineCode> {description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
