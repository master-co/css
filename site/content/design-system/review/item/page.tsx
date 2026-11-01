import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import { DemoItem, DemoLabel, DemoLegend } from '~/site/components/demo'

export { metadata }

const tones = ['neutral', 'blue', 'violet', 'amber', 'green', 'red'] as const
const variants = ['soft', 'solid', 'outline', 'ghost'] as const

export default function Page() {
  return <ComponentPage title="Item" description="An item stands for content inside a specimen. Neutral is the context; a named tone marks the subject or a comparison, and a legend or label always names it." sections={[
    { id: 'tones', title: 'Tone and paint', children: <Demo background="dots" caption="Tone chooses the hue; variant chooses the paint. Neither changes the item’s size.">
      <div className="grid gap-sm w-full (max-width:34rem)">
        <div className="grid-cols(5) gap-sm"><span />{variants.map(variant => <DemoLabel key={variant} className="text-center">{variant}</DemoLabel>)}</div>
        {tones.map(tone => <div key={tone} className="grid-cols(5) items-center gap-sm">
          <DemoLabel>{tone}</DemoLabel>
          {variants.map(variant => <DemoItem key={variant} tone={tone} variant={variant}>Aa</DemoItem>)}
        </div>)}
      </div>
    </Demo> },
    { id: 'in-a-lesson', title: 'In a lesson', description: 'The example supplies the layout: here a hatched padding box and a gap between three items.', children: <Demo background="hatch" caption={<DemoLegend items={[{ label: 'Context', tone: 'neutral' }, { label: 'Subject', tone: 'blue' }]} />}>
      <div className="grid-cols(3) gap-md w-full (max-width:22rem) p-md r-lg bg-surface-raised"><DemoItem>01</DemoItem><DemoItem tone="blue">02</DemoItem><DemoItem>03</DemoItem></div>
    </Demo> },
  ]} usage={{ href: '/guide/layout-system#namespace-for-spacing', label: 'the Layout System guide' }} Documentation={ComponentDocumentation} />
}
