import Link from 'next/link'

import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import DemoViewport from '~/site/components/demo/DemoViewport'
import { generatePresetCSS } from '~/site/common/generate-preset-css'
import { getThemeNumericVariableEntries } from '~/site/utils/theme-variables'
import './page.css'

export const metadata = {
  title: 'Demo viewport review',
  description: 'Current Demo viewport and practical examples.'
}

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
  return <Demo padding="none" background="plain">
    <div className="review-viewport-currentPreview">
      <DemoViewport title="Responsive button" document={document}
        responsive widthPresets={widths} height={132} inspect={['padding']} />
    </div>
  </Demo>
}

const options = [
  {
    number: '01', title: 'Current', detail: 'Bounded specimen viewport',
    note: 'A hairline around the frame and a quieter control deck distinguish the actual iframe width from the striped outer demo without changing that width.',
    preview: <Preview />
  }
] as const

export default function Page() {
  return <main className="review-viewport-review">
    <div className="review-viewport-kicker">Design system · Component review 14</div>
    <h1>Demo viewport</h1>
    <p className="review-viewport-intro">A hairline around the frame and a quieter control deck distinguish the actual iframe width from the striped outer demo without changing that width.</p>

    <section aria-labelledby="viewport-options">
      <h2 id="viewport-options">Responsive padding</h2>

      <div className="review-viewport-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-viewport-option" key={number}>
          <div className="review-viewport-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
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
  </main>
}
