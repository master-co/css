'use client'

import { useId, useState, type CSSProperties } from 'react'
import { IconLayoutGrid, IconList, IconArrowRight } from '@tabler/icons-react'
import DemoCopyButton from '~/site/components/demo/DemoCopyButton'

export default function BrandControls() {
  const id = useId()
  const [inset, setInset] = useState(16)
  return <div className="brand-controls-board">
    <div className="brand-controls-row">
      <div><span className="brand-overline">01 / Selection</span><p>One choice has a clear place.</p></div>
      <fieldset className="brand-segmented"><legend className="sr-only">Specimen view</legend>{[
        { value: 'list', title: 'List', Icon: IconList }, { value: 'grid', title: 'Grid', Icon: IconLayoutGrid }
      ].map(({ value, title, Icon }) => <label key={value}><input type="radio" name={`${id}-view`} value={value} defaultChecked={value === 'list'} /><span><Icon size={16} stroke={1.75} aria-hidden="true" />{title}</span></label>)}</fieldset>
    </div>
    <div className="brand-control-preview" style={{ '--brand-demo-inset': `${inset}px` } as CSSProperties} aria-label="Layout preview">
      {['Canvas', 'Content', 'Control'].map((name, index) => <div key={name}><span className="brand-preview-index">0{index + 1}</span><strong>{name}</strong><span>{['A quiet foundation', 'Room for the details', 'A clear next action'][index]}</span><IconArrowRight size={16} aria-hidden="true" /></div>)}
    </div>
    <label className="brand-range-label"><span>Content inset <output htmlFor={`${id}-inset`}>{inset}px</output></span><input id={`${id}-inset`} type="range" min="12" max="32" step="4" value={inset} onChange={event => setInset(Number(event.target.value))} /></label>
    <div className="brand-controls-row"><div><span className="brand-overline">02 / Action</span><p>Copy <code>var(--color-surface-raised)</code>.</p></div><div className="brand-control-actions"><DemoCopyButton value="var(--color-surface-raised)" label="Copy the raised surface variable" feedback="compact" className="brand-button">Copy token</DemoCopyButton><button type="button" className="brand-button" disabled>Unavailable</button></div></div>
    <details className="brand-state-note"><summary>Selection, pressing and focus are different states.</summary><p>A selection persists. Pressing acknowledges the current action. A focus ring follows the keyboard. These controls preserve their labels and dimensions through every state.</p></details>
  </div>
}
