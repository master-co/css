import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import { DemoLabel, DemoMedia } from '~/site/components/demo'

export { metadata }

export default function Page() {
  return <ComponentPage title="Media" description="A line drawing that takes a named tone through currentColor, or a real image with its intrinsic dimensions." sections={[
    { id: 'tones', title: 'Artwork in a tone', children: <Demo padding="sm">
      <div className="grid-cols(1) gap-md w-full grid-cols(3)@sm">
        {(['neutral', 'blue', 'violet'] as const).map(tone => <div key={tone} className="grid gap-xs"><DemoLabel>tone=&quot;{tone}&quot;</DemoLabel><DemoMedia tone={tone} className="h-auto w-full r-sm" aria-label={`Mountain illustration in the ${tone} tone`} /></div>)}
      </div>
    </Demo> },
    { id: 'image', title: 'A real image', children: <Demo padding="sm" caption="Text wraps around the floated image and continues in the remaining inline space.">
      <div className="(display:flow-root) w-full max-w-md text-sm">
        <DemoMedia src="/demo/landscape.svg" width={112} height={70} alt="Sun above layered mountains" className="(float:left) h-auto (width:7rem) mb-sm mr-md r-sm" />
        <p className="m(0)">Reset the float when the image should return to normal document flow. The image keeps its intrinsic ratio at every width.</p>
      </div>
    </Demo> },
  ]} usage={{ href: '/guide/responsive-design', label: 'the Responsive Design guide' }} Documentation={ComponentDocumentation} />
}
