import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import DemoCopyButton from '~/site/components/demo/DemoCopyButton'

export { metadata }

export default function Page() {
  return <ComponentPage title="Copy" description="A copy button and a status beside it. The status reports the real clipboard result, including when copying is unavailable." sections={[
    { id: 'value', title: 'Value and compact feedback', children: <Demo padding="sm" caption="Value feedback repeats what was copied; compact feedback suits a specimen that already shows it.">
      <div className="grid gap-md py-md">
        <DemoCopyButton value="var(--color-blue-60)" label="Copy the blue 60 variable">Copy variable</DemoCopyButton>
        <DemoCopyButton value="var(--ui-surface-sheet)" label="Copy the sheet surface variable" feedback="compact">Copy surface</DemoCopyButton>
      </div>
    </Demo> },
  ]} usage={{ href: '/design-system/review/palette', label: 'Palette' }} Documentation={ComponentDocumentation} />
}
