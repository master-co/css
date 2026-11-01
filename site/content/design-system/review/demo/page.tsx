import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import Code from '~/site/docs-shell/components/Code'
import ComponentPage from '../../components/ComponentPage'
import { Demo, DemoGeneratedCSS, DemoItem } from '~/site/components/demo'
import { DemoControls } from '~/site/components/demo/primitives'

export { metadata }

const html = '<div class="grid-cols(3) gap-md p-md">\n  <div>01</div>\n  <div>02</div>\n  <div>03</div>\n</div>'

export default function Page() {
  return <ComponentPage title="Tray and stage" description="One example is one tray. Its head names the example and holds its tools; the lit stage shows the specimen; the code window keeps the source with a closed Generated CSS disclosure; the caption says what to notice." sections={[
    { id: 'complete', title: 'A complete example', children: <Demo title="Padding around the group, gap between items" background="hatch"
      controls={<DemoControls label="Gap" variant="segmented"><button type="button" aria-pressed="false">sm</button><button type="button" aria-pressed="true">md</button><button type="button" aria-pressed="false">lg</button></DemoControls>}
      source={<><Code lang="html">{html}</Code><DemoGeneratedCSS><Code lang="css" beautify>{'.grid-cols\\(3\\) { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) }\n.gap-md { gap: var(--spacing-md) }\n.p-md { padding: var(--spacing-md) }'}</Code></DemoGeneratedCSS></>}
      caption="The hatch shows p-md around the grid and gap-md between its children.">
      <div className="grid-cols(3) gap-md w-full (max-width:20rem) p-md r-lg bg-surface-raised"><DemoItem>01</DemoItem><DemoItem>02</DemoItem><DemoItem>03</DemoItem></div>
    </Demo> },
    { id: 'stage-only', title: 'Stage only', description: 'Without a head or source the tray is a quiet frame around one specimen; a lone caption names the figure.', children: <Demo caption="A caption alone describes the figure."><DemoItem tone="blue">Subject</DemoItem></Demo> },
  ]} usage={{ href: '/guide/syntax-tutorial', label: 'the Syntax Tutorial' }} Documentation={ComponentDocumentation} />
}
