'use client'

import { useId, useState, type CSSProperties } from 'react'
import DemoMeasure from '~/site/components/demo/DemoMeasure'
import Demo from '~/site/components/demo/Demo'
import { DemoSurface } from '~/site/components/demo/primitives'

export default function MeasureReviewStage() {
  const widthId = useId()
  const detailsId = useId()
  const [requestedWidth, setRequestedWidth] = useState(300)
  const [showDetails, setShowDetails] = useState(false)
  return <Demo title="Content bounds" background="grid" controls={<>
    <label className="ui-label" data-case="as-is" htmlFor={widthId}>Width · {requestedWidth} px</label>
    <input id={widthId} className="ui-range" type="range" min={180} max={460} step={20} value={requestedWidth}
      style={{ '--value': `${((requestedWidth - 180) / 280) * 100}%`, width: '8rem' } as CSSProperties}
      onChange={event => setRequestedWidth(Number(event.target.value))} />
    <label className="ui-check" htmlFor={detailsId}>
      <input id={detailsId} type="checkbox" checked={showDetails} onChange={event => setShowDetails(event.target.checked)} />
      Add detail
    </label>
  </>} caption="The rule reports the actual rendered box. At narrow widths, the available space can be less than the requested width.">
    <div style={{ width: `min(100%, ${requestedWidth}px)` }}>
      <DemoMeasure label="Content bounds">
        <DemoSurface elevation="raised" className="grid gap-xs p-md">
          <strong className="text-sm fg-text-strong">Collection panel</strong>
          <p className="m(0) text-sm">The subject stays inside its measured boundary.</p>
          {showDetails && <p className="m(0) text-sm">Additional fields appear beneath the summary. Their content wraps naturally at narrow widths and increases the panel’s measured height.</p>}
        </DemoSurface>
      </DemoMeasure>
    </div>
  </Demo>
}
