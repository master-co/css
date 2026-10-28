import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'

import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import DemoViewport from '~/site/components/demo/DemoViewport'
import { generatePresetCSS } from '~/site/common/generate-preset-css'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'
import './page.css'

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

function Preview() {
  return <Demo padding="none" frame="none" background="plain">
    <div className="review-viewport-currentPreview">
      <DemoViewport title="Responsive button" document={document}
        responsive widthPresets={widths} height={132} inspect={['padding']} />
    </div>
  </Demo>
}

const options = [
  {
    number: '01', note: 'A hairline around the frame and a quieter control deck distinguish the actual iframe width from its fitted surround without changing that width.',
    preview: <Preview />
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-viewport-review">
    <ReviewNavigation />
    <h1>Demo viewport</h1>
    <p className="review-viewport-intro">A hairline around the frame and a quieter control deck distinguish the actual iframe width from its fitted surround without changing that width.</p>

    <section aria-labelledby="viewport-options">
      <h2 id="viewport-options">Responsive padding</h2>

      <div className="review-viewport-options">
        {options.map(({ number, note, preview }) => <article className="review-viewport-option" key={number}>
          <div className="review-viewport-optionPreview">{preview}</div>
          <p className="review-viewport-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="viewport-real-use">
      <div className="review-viewport-sectionHeading">
        <div><h2 id="viewport-real-use">Actual Reference use</h2><p>The padding reference crosses the same breakpoint inside an iframe, preserving the class and its browser behavior.</p></div>
        <Link href="/guide/spacing">Open /guide/spacing</Link>
      </div>
      <DemoExample page="padding" section="apply-conditionally" />
      <p className="review-viewport-optionNote">The Reference keeps control of its teaching geometry. Viewport decoration must not make an outer container query look like a real media query.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
