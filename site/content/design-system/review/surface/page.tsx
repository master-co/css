import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import { Demo, DemoLabel, DemoSurface } from '~/site/components/demo'

export { metadata }

export default function Page() {
  return <ComponentPage title="Sheet and well" description="A sheet is a raised face on the stage; a well is a sunken field below its surroundings. Elevation, not hue, separates them." sections={[
    { id: 'sheet-elevation', title: 'Elevation', children: <Demo background="dots" caption="data-elevation chooses flat, rise-1, rise-2 (the default) or rise-3. Geometry and padding stay with the example.">
      <div className="grid-cols(2) gap-lg w-full grid-cols(4)@sm">
        {(['flat', '1', undefined, '3'] as const).map(elevation => <div key={elevation ?? 'default'} className="grid gap-xs p-md ui-sheet" data-elevation={elevation}>
          <DemoLabel>{elevation ? `data-elevation="${elevation}"` : 'default · rise-2'}</DemoLabel><span className="text-sm fg-text-strong">Collection</span>
        </div>)}
      </div>
    </Demo> },
    { id: 'surface-component', title: 'DemoSurface', description: 'The specimen component renders a flat sheet by default and rise-1 with elevation="raised".', children: <Demo>
      <div className="grid-cols(1) gap-md w-full grid-cols(2)@sm">
        <DemoSurface className="p-md"><DemoLabel>flat</DemoLabel><p className="mb(0) mt-xs text-sm">Start with the collection overview and its key details.</p></DemoSurface>
        <DemoSurface elevation="raised" className="p-md"><DemoLabel>raised</DemoLabel><p className="mb(0) mt-xs text-sm">Continue through each column in reading order.</p></DemoSurface>
      </div>
    </Demo> },
    { id: 'well', title: 'Well', description: 'Inputs, tracks and pressed states sink into a well.', children: <Demo padding="sm">
      <div className="grid gap-xs w-full (max-width:22rem) p-md ui-well"><DemoLabel>ui-well</DemoLabel><span className="text-sm">A sunken field for entry and selection.</span></div>
    </Demo> },
  ]} usage={{ href: '/guide/view-transitions', label: 'the View transitions guide' }} Documentation={ComponentDocumentation} />
}
