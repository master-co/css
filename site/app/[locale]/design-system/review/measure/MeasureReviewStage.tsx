'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import DemoMeasure from '~/site/components/demo/DemoMeasure'
import { DemoSurface } from '~/site/components/demo/primitives'

function PreviousMeasure({ children, label }: { children: ReactNode, label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ width: number, height: number }>()

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      const bounds = element.getBoundingClientRect()
      setSize({ width: Math.round(bounds.width), height: Math.round(bounds.height) })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <div>
    <div className="review-measure-previousMeasureLine"><span>{label}{size && ` · ${size.width} × ${size.height} px`}</span></div>
    <div ref={ref}>{children}</div>
  </div>
}

export default function MeasureReviewStage({ adopted = false }: { adopted?: boolean }) {
  const widthId = useId()
  const detailsId = useId()
  const [requestedWidth, setRequestedWidth] = useState(300)
  const [showDetails, setShowDetails] = useState(false)
  const content = <DemoSurface className="review-measure-measuredSurface">
    <strong>Collection panel</strong>
    <p>The subject stays inside its measured boundary.</p>
    {showDetails && <p>Additional fields appear beneath the summary. Their content wraps naturally at narrow widths and increases the panel’s measured height.</p>}
  </DemoSurface>

  return <div className="review-measure-interactive">
    <div className="review-measure-controls">
      <label htmlFor={widthId}>Requested width <output>{requestedWidth} px</output></label>
      <input id={widthId} type="range" min={180} max={460} step={20} value={requestedWidth}
        onChange={event => setRequestedWidth(Number(event.target.value))} />
      <label className="review-measure-detailToggle" htmlFor={detailsId}>
        <input id={detailsId} type="checkbox" checked={showDetails} onChange={event => setShowDetails(event.target.checked)} />
        Add detail
      </label>
    </div>
    <div className="review-measure-stage">
      <div className="review-measure-widthBoundary" style={{ width: `min(100%, ${requestedWidth}px)` }}>
        {adopted
          ? <DemoMeasure label="Content bounds">{content}</DemoMeasure>
          : <PreviousMeasure label="Content bounds">{content}</PreviousMeasure>}
      </div>
    </div>
    <p className="review-measure-stageNote">The ruler reports the actual rendered box. At narrow widths, the available space can be less than the requested width.</p>
  </div>
}
