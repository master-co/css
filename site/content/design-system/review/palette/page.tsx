import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import DemoPalette from '~/site/components/demo/DemoPalette'

export { metadata }

export default function Page() {
  return <ComponentPage title="Palette" description="Every step of a preset hue as a copy action. One status line above the chips reports the actual clipboard result." sections={[
    { id: 'families', title: 'Two families', children: <DemoPalette families={['blue', 'violet']} /> },
  ]} usage={{ href: '/guide/colors', label: 'the Colors guide' }} Documentation={ComponentDocumentation} />
}
