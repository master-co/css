import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import { DemoAxes, DemoItem, DemoSurface } from '~/site/components/demo'
import AnnotationComposition from './AnnotationComposition'

export { metadata }

export default function Page() {
  return <ComponentPage title="Axes" description="Drafting arrows name the main and cross axes around a subject. They sit outside the layout they explain." sections={[
    { id: 'flex-axes', title: 'Main and cross axis', children: <Demo>
      <DemoAxes className="w-full (max-width:26rem)">
        <DemoSurface className="flex gap-sm p-md"><DemoItem tone="blue">01</DemoItem><DemoItem tone="violet">02</DemoItem><DemoItem>03</DemoItem></DemoSurface>
      </DemoAxes>
    </Demo> },
    { id: 'composition', title: 'With a measure and a legend', children: <AnnotationComposition /> },
  ]} usage={{ href: '/guide/layout-system', label: 'the Layout System guide' }} Documentation={ComponentDocumentation} />
}
