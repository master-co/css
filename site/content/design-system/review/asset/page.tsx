import metadata from './metadata'
import { brandAssets } from '~/site/common/brand'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import DemoAsset from '~/site/components/demo/DemoAsset'

export { metadata }

export default function Page() {
  return <ComponentPage title="Downloadable asset" description="Light and dark artwork sits on a sheet in its own mode; transparent artwork sits on a checkerboard. The download names its format." sections={[
    { id: 'grounds', title: 'Grounds', children: <div className="grid-cols(1) gap-md grid-cols(2)@sm">
      <DemoAsset {...brandAssets[0]} />
      <DemoAsset {...brandAssets[1]} />
      <DemoAsset {...brandAssets[2]} surface="transparent" />
    </div> },
  ]} usage={{ href: '/brand', label: 'the brand page' }} Documentation={ComponentDocumentation} />
}
