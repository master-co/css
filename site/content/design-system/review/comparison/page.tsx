import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import { Demo, DemoComparison, DemoItem } from '~/site/components/demo'
import ShadowScaleDemo from '~/site/components/demo/foundations/ShadowScaleDemo'

export { metadata }

export default function Page() {
  return <ComponentPage title="Compare" description="Two stages side by side, each named by its condition. They stack when there is not enough room for both." sections={[
    { id: 'conditions', title: 'Two conditions', children: <Demo title="Stacked below 40rem" frame="none" caption="Each stage is captioned with the condition it shows.">
      <DemoComparison items={[
        { label: '@media (width < 40rem)', children: <div className="grid gap-sm"><DemoItem tone="blue">01</DemoItem><DemoItem tone="blue">02</DemoItem></div> },
        { label: '@media (width ≥ 40rem)', children: <div className="flex gap-sm"><DemoItem tone="blue">01</DemoItem><DemoItem tone="blue">02</DemoItem></div> },
      ]} />
    </Demo> },
    { id: 'scale', title: 'A complete scale', description: 'A scale of more than two values is a grid of labelled specimens on one stage.', children: <ShadowScaleDemo /> },
  ]} usage={{ href: '/guide/colors#raised-surfaces', label: 'the Colors guide' }} Documentation={ComponentDocumentation} />
}
