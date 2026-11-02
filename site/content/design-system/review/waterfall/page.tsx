import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import GuideResourceWaterfall from '~/site/components/demo/ResourceWaterfall'
import DemoWaterfall from '~/site/components/demo/DemoWaterfall'
import { resourceWaterfalls } from '~/site/utils/first-paint-examples'

export { metadata }

export default function Page() {
  return <ComponentPage kicker="Documents" title="Delivery diagram" description="Resource order on one time axis, with the first-paint marker named." sections={[
    { id: 'single', title: 'One scenario', children: <DemoWaterfall {...resourceWaterfalls[0]} /> },
    { id: 'guide', title: 'In the Guide', description: 'The preload lesson compares both scenarios.', children: <GuideResourceWaterfall /> },
  ]} usage={{ href: '/guide/rendering-modes#preload-runtime-engine', label: 'the Rendering modes guide' }} Documentation={ComponentDocumentation} />
}
