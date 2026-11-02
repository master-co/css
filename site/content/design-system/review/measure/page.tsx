import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import DemoExample from '~/site/components/demo/DemoExample'
import MeasureReviewStage from './MeasureReviewStage'

export { metadata }

export default function Page() {
  return <ComponentPage title="Measure" description="A hairline with end dots and the browser’s own reading above it. The wrapper measures; it never joins the layout it measures." sections={[
    { id: 'bounds', title: 'Live bounds', children: <MeasureReviewStage /> },
    { id: 'reference', title: 'In a reference specimen', children: <DemoExample page="width" section="set-a-fixed-or-fluid-width" /> },
  ]} usage={{ href: '/reference/tokens/container', label: 'the container size reference' }} Documentation={ComponentDocumentation} />
}
