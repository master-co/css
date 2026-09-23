import Demo from './Demo'
import DemoCopyButton, { DemoCopyGroup } from './DemoCopyButton'
import { getThemeVariables } from '~/site/utils/theme-variables'

export default function DemoPalette({ families }: { families?: string[] }) {
  const groups = new Map<string, { name: string, step: number, value: string }[]>()
  for (const variable of getThemeVariables('color')) {
    const match = variable.name?.match(/^color-(.+)-(\d+)$/)
    if (!match || typeof variable.value !== 'string' || (families && !families.includes(match[1]))) continue
    const [, family, step] = match
    if (!groups.has(family)) groups.set(family, [])
    groups.get(family)!.push({ name: variable.name!, step: Number(step), value: variable.value })
  }
  return <Demo title="Preset palette" background="plain" padding="md" data-foundation-palette caption="Choose a swatch to copy its CSS variable reference. Each swatch shows the fixed preset value in both themes.">
    <DemoCopyGroup><div className="demo-palette">
      {[...groups].map(([family, colors]) => <section key={family} aria-label={`${family} palette`}>
        <h3 className="demo-palette-title">{family}</h3>
        <div className="demo-palette-row">
          {colors.sort((a, b) => a.step - b.step).map(({ name, step, value }) => <div key={name}>
            <DemoCopyButton value={`var(--${name})`} label={`Copy ${name}`} icon={null} className="demo-palette-chip" style={{ backgroundColor: value }} title={`${name}: ${value}`} />
            <span className="demo-label">{step}</span>
          </div>)}
        </div>
      </section>)}
    </div></DemoCopyGroup>
  </Demo>
}
