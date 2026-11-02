'use client'

import { useId, useState, type CSSProperties } from 'react'
import { IconCopy, IconPlus } from '@tabler/icons-react'
import Demo from '~/site/components/demo/Demo'
import { DemoControls, DemoItem, DemoLabel, DemoLegend } from '~/site/components/demo/primitives'

const options = [
  { value: 'items-flex-start', label: 'Start' },
  { value: 'items-center', label: 'Center' },
  { value: 'items-flex-end', label: 'End' }
] as const

export default function ControlsReviewScene() {
  const [alignment, setAlignment] = useState<(typeof options)[number]['value']>('items-flex-start')
  return <Demo title="Cross-axis alignment" background="grid" controls={<DemoControls label="Cross-axis alignment" variant="segmented">
    {options.map(({ value, label }) => <button key={value} type="button" aria-pressed={alignment === value} onClick={() => setAlignment(value)}>{label}</button>)}
  </DemoControls>} caption="Selection changes the actual alignment utility on the flex parent. Scroll the preview horizontally when space is limited.">
    <div className="grid gap-md w-full">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard focus enables native horizontal scrolling. */}
      <div className="overflow-x-auto w-full p(4)" role="region" aria-label="Alignment preview" tabIndex={0} data-preview-scroll="">
        <div className={`flex gap-sm (height:10rem) (min-width:18rem) ${alignment}`}>
          <DemoItem tone="blue" className="(flex:1)">01</DemoItem>
          <DemoItem tone="violet" className="(flex:1) (height:var(--spacing-4xl))">02</DemoItem>
          <DemoItem className="(flex:1)">03</DemoItem>
        </div>
      </div>
      <DemoLegend className="justify-center" items={[{ label: 'Subject', tone: 'blue' }, { label: 'Taller comparison', tone: 'violet' }, { label: 'Context', tone: 'neutral' }]} />
    </div>
  </Demo>
}

/** Every control in its resting state, with the states that documentation shows statically named by data-state. */
export function ControlsGallery() {
  const [range, setRange] = useState(40)
  const [view, setView] = useState('Preview')
  const id = useId()
  return <>
    <Demo title="Buttons" description="Default, primary and quiet; hover lifts, pressing sinks" caption="The static hover and pressed specimens use data-state; real buttons use native :hover, :active and :focus-visible.">
      <div className="grid (justify-items:center) gap-lg">
        <div className="flex flex-wrap justify-center gap-sm">
          <button type="button" className="ui-button">Default</button>
          <button type="button" className="ui-button" data-variant="primary">Primary</button>
          <button type="button" className="ui-button" data-variant="quiet">Quiet</button>
          <button type="button" className="ui-button" disabled>Disabled</button>
          <button type="button" className="ui-button" data-shape="icon" aria-label="Add"><IconPlus aria-hidden="true" /></button>
        </div>
        <div className="flex flex-wrap items-end justify-center gap-sm">
          {(['hover', 'pressed', 'focus'] as const).map(state => <div key={state} className="grid (justify-items:center) gap-xs">
            <span className="ui-button" data-state={state} aria-hidden="true">Save</span><DemoLabel>{state}</DemoLabel>
          </div>)}
          <div className="grid (justify-items:center) gap-xs"><span className="ui-button" data-size="sm" aria-hidden="true"><IconCopy aria-hidden="true" />Small</span><DemoLabel>data-size=&quot;sm&quot;</DemoLabel></div>
        </div>
      </div>
    </Demo>
    <Demo title="Choices and fields" description="Selected segments rise inside a sunken track; fields float back to the sheet on focus" padding="sm">
      <div className="grid gap-lg w-full max-w-md py-lg">
        <div className="w-fit ui-segmented" role="group" aria-label="View">
          {['Preview', 'Code', 'Output'].map(name => <button key={name} type="button" aria-pressed={view === name} onClick={() => setView(name)}>{name}</button>)}
        </div>
        <label className="ui-field">Collection name<input className="ui-input" placeholder="Field notes" /><span className="ui-field-hint">Shown above the cards.</span></label>
        <label className="ui-field">Sort by<select className="ui-select" defaultValue="recent"><option value="recent">Most recent</option><option value="name">Name</option></select></label>
        <div className="grid gap-xs">
          <label className="ui-label" data-case="as-is" htmlFor={id}>Width · {range}%</label>
          <input id={id} className="ui-range" type="range" min={0} max={100} value={range} onChange={event => setRange(Number(event.target.value))} style={{ '--value': `${range}%` } as CSSProperties} />
        </div>
        <div className="flex flex-wrap gap-lg">
          <label className="ui-check"><input type="checkbox" defaultChecked />Show captions</label>
          <label className="ui-check"><input type="radio" name={`${id}-density`} defaultChecked />Comfortable</label>
          <label className="ui-check"><input type="radio" name={`${id}-density`} />Compact</label>
          <label className="ui-check"><input type="checkbox" role="switch" className="ui-switch" defaultChecked />Sync</label>
        </div>
      </div>
    </Demo>
  </>
}
