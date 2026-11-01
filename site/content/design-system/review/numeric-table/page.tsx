import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import ThemeNumberVariableTable from '~/site/components/ThemeNumberVariableTable'

export { metadata }

export default function Page() {
  return <ComponentPage kicker="Documents" title="Numeric tokens" description="Original values beside a useful comparison, from the active preset." sections={[
    { id: 'spacing', title: 'Spacing with its representation', children: <ThemeNumberVariableTable namespace="spacing" representation="spacing" /> },
  ]} usage={{ href: '/guide/layout-system#namespace-for-spacing', label: 'the Layout System guide' }} Documentation={ComponentDocumentation} />
}
