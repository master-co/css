import Demo from '~/site/components/demo/Demo'
import { DemoLabel } from '~/site/components/demo/primitives'

import { getShadowRows } from '~/site/common/foundation-data/elevation/shadow-data'

/** Every preset shadow on the same raised surface; used by the design-system review pages. */
export default function ShadowScaleDemo() {
  return (
    <Demo align="start">
      <div className="container-inline w-full">
        <div className="grid-cols(1) gap-xl w-full grid-cols(2)@container(width>=18rem)">
          {getShadowRows().map(({ key, utility, role, description }) => (
            <div className={`bg-surface-raised r-lg p-lg ${utility}`} key={key}>
              <DemoLabel>{utility}</DemoLabel>
              <div className="font-medium fg-text-strong">{role}</div>
              <p className="mb(0) mx(0) mt-xs text-sm fg-text-muted">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </Demo>
  )
}
