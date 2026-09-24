'use client'

import { useState } from 'react'
import Demo from '~/site/components/demo/Demo'
import { DemoControls, DemoItem } from '~/site/components/demo/primitives'

const options = [
  { value: 'items-start', label: 'Start' },
  { value: 'items-center', label: 'Center' },
  { value: 'items-end', label: 'End' }
] as const

export default function ControlsReviewScene({ candidate = false }: { candidate?: boolean }) {
  const [alignment, setAlignment] = useState<(typeof options)[number]['value']>('items-start')
  const buttons = options.map(({ value, label }) => <button
    key={value}
    type="button"
    className="demo-button"
    aria-pressed={alignment === value}
    onClick={() => setAlignment(value)}
  >{label}</button>)

  return <Demo title="Cross-axis alignment" controls={<DemoControls label="Cross-axis alignment" variant={candidate ? 'segmented' : 'plain'}>{buttons}</DemoControls>}
    caption="Selection changes the actual alignment utility on the flex parent.">
    <div className={`flex gap-sm h:10rem ${alignment}`}>
      <DemoItem tone="blue" className="flex:1 p-md">01</DemoItem>
      <DemoItem tone="violet" className="flex:1 h:6rem p-md">02</DemoItem>
      <DemoItem className="flex:1 p-md">03</DemoItem>
    </div>
  </Demo>
}
