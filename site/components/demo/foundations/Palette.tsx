'use client'

import '~/site/styles/system/specimens.css'
import '~/site/styles/demo.css'
import { useId, useState } from 'react'
import DemoCopyButton, { DemoCopyGroup } from '../DemoCopyButton'

export interface PaletteGroup { family: string; colors: { name: string; step: number; value: string }[] }
/** Wide pages show a hue matrix; narrow pages wrap each hue into two rows. Every chip names its step. */
export default function Palette({ groups }: { groups: PaletteGroup[] }) {
  const [format, setFormat] = useState('value')
  const id = useId()
  const endId = useId()
  return <div className="w-full"><DemoCopyGroup instruction={format === 'value' ? 'Choose a swatch to copy its original CSS color value.' : 'Choose a swatch to copy its CSS variable reference.'}>
    <label className="w-fit ui-field" htmlFor={id}>Copy as
      <select id={id} className="ui-select" data-variant="raised" value={format} onChange={event => setFormat(event.target.value)}>
        <option value="value">CSS value</option><option value="variable">CSS variable</option>
      </select>
    </label>
    <a className="ui-skip" href={`#${endId}`}>Skip color swatches</a>
    <div className="ui-palette">
      {groups.map(group => <div className="ui-palette-row" key={group.family} role="group" aria-label={`${group.family} palette`}>
        <span>{group.family}</span>
        {group.colors.map(color => <div key={color.name} className="ui-palette-cell">
          <DemoCopyButton icon={null} className="ui-palette-chip" style={{ backgroundColor: color.value }}
            value={format === 'value' ? color.value : `var(--${color.name})`}
            label={`Copy ${color.name} ${format === 'value' ? 'CSS value' : 'CSS variable'}`} title={`${color.name}: ${color.value}`} />
          <span aria-hidden="true">{color.step}</span>
        </div>)}
      </div>)}
    </div>
    <div id={endId} tabIndex={-1}><span className="sr-only">End of color palette</span></div>
  </DemoCopyGroup></div>
}
