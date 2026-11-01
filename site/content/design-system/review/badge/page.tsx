import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import { DemoBadge } from '~/site/components/demo'

export { metadata }

const tones = ['neutral', 'blue', 'violet', 'amber', 'green', 'red'] as const

export default function Page() {
  return <ComponentPage title="Badge" description="A short, legible category or state beside a value. It stays outside measured layouts." sections={[
    { id: 'tones', title: 'Tones, dots and sizes', children: <Demo caption="A dot carries state; the text always says it.">
      <div className="grid (justify-items:center) gap-md">
        <div className="flex flex-wrap justify-center gap-xs">{tones.map(tone => <DemoBadge key={tone} tone={tone}>{tone}</DemoBadge>)}</div>
        <div className="flex flex-wrap justify-center gap-xs"><DemoBadge variant="dot" tone="green">Supported</DemoBadge><DemoBadge variant="dot" tone="amber">Partial</DemoBadge><DemoBadge variant="dot">Unknown</DemoBadge></div>
        <div className="flex flex-wrap justify-center gap-xs"><DemoBadge size="sm">sm</DemoBadge><DemoBadge>md</DemoBadge></div>
      </div>
    </Demo> },
  ]} usage={{ href: '/design-system/review/feature-support', label: 'Platform behavior' }} Documentation={ComponentDocumentation} />
}
