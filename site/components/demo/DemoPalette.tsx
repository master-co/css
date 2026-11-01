import '~/site/styles/system/specimens.css'
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
  return <Demo title="Preset palette" padding="sm" data-foundation-palette caption="Choose a swatch to copy its CSS variable reference. Each swatch shows the fixed preset value in both themes.">
    <div className="w-full"><DemoCopyGroup><div className="ui-palette">
      {[...groups].map(([family, colors]) => <div key={family} className="ui-palette-row" role="group" aria-label={`${family} palette`}>
        <span>{family}</span>
        {colors.sort((a, b) => a.step - b.step).map(({ name, value }) =>
          <DemoCopyButton key={name} value={`var(--${name})`} label={`Copy ${name}`} icon={null} className="ui-palette-chip" style={{ backgroundColor: value }} title={`${name}: ${value}`} />)}
      </div>)}
    </div></DemoCopyGroup></div>
  </Demo>
}
