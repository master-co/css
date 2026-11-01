import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import NamespaceUtilityTable, { type NamespaceUtilityGroup } from '~/site/components/NamespaceUtilityTable'
import { DocumentNamespaceTable } from '~/site/components/DocumentValues'
import { variableNamespaceSources } from '~/site/utils/variable-namespace-sources'

export { metadata }

const groups: NamespaceUtilityGroup[] = [
  { label: 'General paint', keys: ['bg', 'background-color', 'fg', 'color', 'accent-color', 'fill'], description: 'Use palette steps and hue aliases for broad paint decisions.' },
  { label: 'Surfaces', keys: ['surface'], description: 'Use surface roles for panels, cards, overlays, and inverse blocks.' },
  { label: 'Line roles', keys: ['b', 'bt', 'br', 'bb', 'bl', 'border-color', 'outline-color', 'stroke'], description: 'Use line roles for borders, dividers, outlines, and strokes.' }
]

export default function Page() {
  return <ComponentPage kicker="Documents" title="Utility table" description="Properties and namespaces from shared facts; the table scrolls by keyboard in a narrow column." sections={[
    { id: 'groups', title: 'Grouped namespaces', children: <NamespaceUtilityTable groups={groups} /> },
    { id: 'sources', title: 'Variable sources', children: <DocumentNamespaceTable rows={variableNamespaceSources.filter(row => row.namespace === 'color')} /> },
  ]} usage={{ href: '/guide/colors#choose-a-color-token', label: 'the Colors guide' }} Documentation={ComponentDocumentation} />
}
