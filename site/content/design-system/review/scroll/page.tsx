import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import { DemoItem, DemoLabel, DemoScrollArea } from '~/site/components/demo'

export { metadata }

const layers = ['Background', 'Content', 'Overlay', 'Navigation', 'Notifications', 'Dialogs', 'Tooltips', 'Toasts']

export default function Page() {
  return <ComponentPage title="Scroll region" description="Overflow stays local inside a sunken well with a focus stop. The page does not scroll with it." sections={[
    { id: 'local-scroll', title: 'Local overflow', children: <Demo caption="Tab to the region, then use the arrow keys.">
      <DemoScrollArea role="region" aria-label="Layer collection" className="(height:12rem) w-full (max-width:20rem)">
        <div className="grid gap-xs p-sm">{layers.map((name, index) => <DemoItem key={name} className="flex (justify-content:space-between) gap-sm"><DemoLabel>0{index + 1}</DemoLabel><span>{name}</span></DemoItem>)}</div>
      </DemoScrollArea>
    </Demo> },
    { id: 'reference', title: 'In a reference specimen', children: <DemoExample page="overflow" section="create-a-scroll-container" /> },
  ]} usage={{ href: '/reference/overflow', label: 'the overflow reference' }} Documentation={ComponentDocumentation} />
}
