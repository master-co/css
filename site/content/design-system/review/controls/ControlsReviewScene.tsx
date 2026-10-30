'use client'

import { useState } from 'react'
import Demo from '~/site/components/demo/Demo'
import { DemoControls, DemoItem } from '~/site/components/demo/primitives'

const options = [
  { value: 'align-items:flex-start', label: 'Start' },
  { value: 'align-items:center', label: 'Center' },
  { value: 'align-items:flex-end', label: 'End' }
] as const

export default function ControlsReviewScene() {
  const [alignment, setAlignment] = useState<(typeof options)[number]['value']>('align-items:flex-start')
  const buttons = options.map(({ value, label }) => <button
    key={value}
    type="button"
    className="demo-button"
    aria-pressed={alignment === value}
    onClick={() => setAlignment(value)}
  >{label}</button>)

  return <Demo title="Cross-axis alignment" controls={<DemoControls label="Cross-axis alignment" variant="segmented">{buttons}</DemoControls>}
    caption="Selection changes the actual alignment utility on the flex parent. Scroll the preview horizontally when space is limited.">
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard focus enables native horizontal scrolling. */}
    <div className="ds-controls-viewport" role="region" aria-label="Alignment preview" tabIndex={0} data-preview-scroll="">
      <div className={`display:flex gap-sm height:10rem ${alignment}`}>
        <DemoItem tone="blue" className="flex:1 p-md">01</DemoItem>
        <DemoItem tone="violet" className="flex:1 height:6rem p-md">02</DemoItem>
        <DemoItem className="flex:1 p-md">03</DemoItem>
      </div>
    </div>
  </Demo>
}
