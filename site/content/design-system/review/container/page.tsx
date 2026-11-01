import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import DemoContainer from '~/site/components/demo/DemoContainer'
import { DemoPageViewport } from '~/site/components/demo/DemoBrowser'

export { metadata }

function QuerySpecimen() {
  return <section className="overflow-hidden container-inline w-full b-solid b(1) b-line-divider r-lg bg-surface-raised">
    <div className="flex flex-col@container(width<=18rem)">
      <div className="(flex:1) p-md bg-surface-inset"><strong>Media</strong><p className="mb(0) mt-2xs text-sm fg-text-muted">A visual region</p></div>
      <div className="(flex:1) p-md"><strong>Content</strong><p className="mb(0) mt-2xs text-sm fg-text-muted">Stacks when this wrapper narrows.</p></div>
    </div>
  </section>
}

export default function Page() {
  return <ComponentPage title="Container" description="The tray head holds a container range, Fit and the live width. The wrapper changes; the page viewport does not." sections={[
    { id: 'query-card', title: 'A query card', children: <DemoContainer title="Query card" caption="Below 18rem of container width the regions stack."><QuerySpecimen /></DemoContainer> },
    { id: 'page-viewport', title: 'A whole page instead', description: 'When the lesson is about the viewport, show the real page in a browser instead of a container.', children: <DemoPageViewport src="/examples/layout-system" title="Workspace layout" height={360} /> },
  ]} usage={{ href: '/guide/responsive-design', label: 'the Responsive Design guide' }} Documentation={ComponentDocumentation} />
}
