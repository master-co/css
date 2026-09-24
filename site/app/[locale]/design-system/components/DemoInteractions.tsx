'use client'

import { useState } from 'react'
import { Demo, DemoControls, DemoItem, DemoLabel, DemoMotion, DemoScrollArea } from '~/site/components/demo'

export default function DemoInteractions() {
  const [alignment, setAlignment] = useState('items-start')
  const options = ['items-start', 'items-center', 'items-end']
  return (
    <>
      <Demo title="Controls with a purpose" controls={<DemoControls label="Cross-axis alignment" variant="segmented">
        {options.map(value => <button type="button" key={value} className="demo-button" aria-pressed={value === alignment} onClick={() => setAlignment(value)}>{value.replace('items-', '')}</button>)}
      </DemoControls>} caption="Controls sit outside the measured layout. Selection changes the actual utility class.">
        <div className={`flex gap-sm h:10rem ${alignment}`}>
          <DemoItem className="flex:1 p-md" tone="blue">01</DemoItem><DemoItem className="flex:1 h:6rem p-md" tone="violet">02</DemoItem><DemoItem className="flex:1 p-md" tone="neutral">03</DemoItem>
        </div>
      </Demo>
      <Demo title="Motion" caption="Animation starts only when requested. Replay returns every animation to its starting time.">
        <DemoMotion><div className="flex justify-center p-lg"><DemoItem className="grid place-content:center size:4rem animation:rotate|2s|linear|infinite">↗</DemoItem></div></DemoMotion>
      </Demo>
      <Demo title="Scroll region" caption="A keyboard-focusable, bounded region keeps scrolling local to the example.">
        <DemoScrollArea role="region" aria-label="Layer collection" className="h:10rem">
          {['Background', 'Composition', 'Typography', 'Annotations', 'Export'].map((name, index) => <DemoItem key={name} tone="neutral" className="mb-xs p-md"><DemoLabel>0{index + 1}</DemoLabel><span className="ml-md">{name}</span></DemoItem>)}
        </DemoScrollArea>
      </Demo>
    </>
  )
}
