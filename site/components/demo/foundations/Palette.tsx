'use client'

import { useId, useState } from 'react'
import DemoCopyButton, { DemoCopyGroup } from '../DemoCopyButton'

export interface PaletteGroup { family: string; colors: { name: string; step: number; value: string }[] }
/** Wide pages show a hue matrix; narrow pages keep every step and label in view. */
export default function Palette({ groups }: { groups: PaletteGroup[] }) {
  const [format, setFormat] = useState('value')
  const id = useId()
  const endId = useId()
  return <DemoCopyGroup instruction={format === 'value' ? 'Choose a swatch to copy its original CSS color value.' : 'Choose a swatch to copy its CSS variable reference.'}>
    <div className="foundation-palette-controls"><label htmlFor={id}>Copy as</label><select id={id} value={format} onChange={event => setFormat(event.target.value)}><option value="value">Original CSS value</option><option value="variable">CSS variable</option></select></div>
    <a className="foundation-palette-skip" href={`#${endId}`}>Skip color swatches</a>
    <div className="foundation-palette-scroll">
      <div className="foundation-palette-matrix">
        <div className="foundation-palette-steps" aria-hidden="true"><span>Hue</span>{groups[0]?.colors.map(color => <span key={color.step}>{color.step}</span>)}</div>
        {groups.map(group => <section className="foundation-palette-row" key={group.family} aria-label={`${group.family} palette`}>
          <div className="foundation-palette-hue">{group.family}</div>
          {group.colors.map(color => <div className="foundation-palette-cell" key={color.name}>
            <DemoCopyButton icon={null} className="foundation-palette-chip" style={{ backgroundColor: color.value }}
              value={format === 'value' ? color.value : `var(--${color.name})`}
              label={`Copy ${color.name} ${format === 'value' ? 'CSS value' : 'CSS variable'}`} title={`${color.name}: ${color.value}`} />
            <span className="foundation-palette-step">{color.step}</span>
          </div>)}
        </section>)}
      </div>
    </div>
    <div id={endId} tabIndex={-1}><span className="sr-only">End of color palette</span></div>
  </DemoCopyGroup>
}
