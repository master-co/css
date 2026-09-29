import InlineCode from '~/site/docs-shell/components/InlineCode'

import { sizingRoles } from '~/site/common/foundation-data/sizing/scale-data'

function renderInlineCodes(values: string[]) {
  return (
    <div className="display:flex flex-wrap:wrap gap-xs">
      {values.map((value) => (
        <InlineCode key={value} className="white-space:nowrap">{value}</InlineCode>
      ))}
    </div>
  )
}

export function SizingRoleTable() {
  return (
    <figure>
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Role</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {sizingRoles.map(({ utility, role, description }) => (
              <tr key={utility}>
                <td>{renderInlineCodes(utility.split(', '))}</td>
                <td>{role}</td>
                <td>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
