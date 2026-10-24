import { DemoDark, DemoLight } from '~/site/components/demo/DemoMode'
import Demo from '~/site/components/demo/Demo'
import { DemoLabel } from '~/site/components/demo/primitives'
import InlineCode from '~/site/docs-shell/components/InlineCode'

import { getShadowRows } from '~/site/common/foundation-data/elevation/shadow-data'

export function ShadowTokenTable() {
  const rows = getShadowRows()

  return (
    <figure>
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Class</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, token, utility, role, description }) => (
              <tr key={key}>
                <td>
                  <InlineCode className="white-space:nowrap">{token}</InlineCode>
                </td>
                <td>
                  <InlineCode className="white-space:nowrap">{utility}</InlineCode>
                </td>
                <td>
                  {role}, {description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

export function ShadowScaleDemo() {
  return (
    <Demo>
      <div className="container-type:inline-size width:100%">
        <div className="grid-cols(1) gap-xl width:100% grid-cols(2)@container((width>=18rem))">
          {getShadowRows().map(({ key, utility, role, description }) => (
            <div className={`bg-surface-raised r-lg p-lg ${utility}`} key={key}>
              <DemoLabel>{utility}</DemoLabel>
              <div className="font-medium fg-text-strong">{role}</div>
              <p className="margin-inline:0 mt-xs margin-bottom:0 text-sm fg-text-muted">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </Demo>
  )
}

function SurfaceStack() {
  return (
    <div className="p-lg r-lg bg-surface-raised shadow-lg">
      <div className="text-lg font-medium fg-text-strong">Raised surface</div>
      <p className="margin-inline:0 mt-xs margin-bottom:0 text-sm fg-text-muted">Cards use a large shadow on a raised surface.</p>
    </div>
  )
}

export function SurfaceElevationDemo() {
  return (
    <Demo padding="none" className="display:flex flex-wrap:wrap container-type:inline-size">
      <DemoLight>
        <SurfaceStack />
      </DemoLight>
      <DemoDark>
        <SurfaceStack />
      </DemoDark>
    </Demo>
  )
}
