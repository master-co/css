import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import { DemoItem, DemoLegend } from '~/site/components/demo'

export { metadata }

export default function Page() {
  return <ComponentPage title="Legend" description="Hue is only allowed in a specimen when something names it. The legend is that name." sections={[
    { id: 'roles', title: 'Context, subject and comparison', children: <Demo caption={<DemoLegend items={[{ label: 'Context', tone: 'neutral' }, { label: 'Subject', tone: 'blue' }, { label: 'Comparison', tone: 'violet' }]} />}>
      <div className="flex gap-sm"><DemoItem>01</DemoItem><DemoItem tone="blue">02</DemoItem><DemoItem tone="violet">03</DemoItem></div>
    </Demo> },
    { id: 'outcomes', title: 'Outcomes', children: <Demo padding="sm"><DemoLegend items={[{ label: 'Measured', tone: 'amber' }, { label: 'Passes', tone: 'green' }, { label: 'Fails', tone: 'red' }]} /></Demo> },
  ]} usage={{ href: '/design-system/review/axes', label: 'Axes' }} Documentation={ComponentDocumentation} />
}
