import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import DemoViewport from '~/site/components/demo/DemoViewport'
import { generatePresetCSS } from '~/site/common/generate-preset-css'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'

export { metadata }

const classes = ['p-md', 'p-lg@sm', 'fg-blue-60:hover', 'fg-blue-60:focus-visible']
const breakpoint = getThemeNumericVariableEntries('breakpoint').find(entry => entry.key === 'sm')?.px
if (!breakpoint) throw new Error('Viewport review requires the preset sm breakpoint')
const widths = [
  { label: 'Below sm', width: Math.floor(breakpoint) - 1 },
  { label: 'At sm', width: Math.ceil(breakpoint) + 1 },
]
const document = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
@layer theme, base, defaults, components, utilities;
@layer base { :root { color-scheme: light dark; } body { margin: 24px; font: 16px system-ui; } button { font: inherit; } }
${generatePresetCSS(classes)}
</style></head><body><button type="button" class="${classes.join(' ')}">Save</button></body></html>`

export default function Page() {
  return <ComponentPage title="Browser viewport" description="A real document in an iframe, framed as a small browser. The address well names the document and its live size; presets, the range and the edge handle change the actual viewport width." sections={[
    { id: 'responsive', title: 'Responsive presets', children: <Demo title="Responsive button" frame="none" caption="The presets cross the sm breakpoint inside the iframe. The padding readout comes from the real computed style.">
      <DemoViewport title="Responsive button" document={document} responsive widthPresets={widths} height={132} inspect={['padding']} />
    </Demo> },
    { id: 'reference-demo', title: 'A reference specimen', description: 'Reference demos compile their own isolated document with the system roles and the preset tokens they use.', children: <DemoExample page="width" section="set-a-fixed-or-fluid-width" /> },
  ]} usage={{ href: '/guide/responsive-design', label: 'the Responsive Design guide' }} Documentation={ComponentDocumentation} />
}
