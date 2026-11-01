import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import { DemoItem, DemoLabel } from '~/site/components/demo'
import ShadowScaleDemo from '~/site/components/demo/foundations/ShadowScaleDemo'

export { metadata }

export default function Page() {
  return <ComponentPage title="Label" description="A label names the condition, value or class a specimen shows. It sits above or beside the subject, never inside the measured layout." sections={[
    { id: 'cases', title: 'As written or uppercase', children: <Demo caption="Class names and values keep their case; a quiet heading may be uppercase.">
      <div className="grid-cols(2) gap-lg w-full (max-width:24rem)">
        <div className="grid gap-xs"><DemoLabel>p-md · gap-sm</DemoLabel><DemoItem>Aa</DemoItem></div>
        <div className="grid gap-xs"><DemoLabel upper>Collection / 024</DemoLabel><DemoItem>Aa</DemoItem></div>
      </div>
    </Demo> },
    { id: 'scale', title: 'Labelling a scale', children: <ShadowScaleDemo /> },
  ]} usage={{ href: '/guide/colors#raised-surfaces', label: 'the Colors guide' }} Documentation={ComponentDocumentation} />
}
