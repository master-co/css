import metadata from './metadata'
import ReviewNavigation from '../../components/ReviewNavigation'
import ComponentDocumentation from './content.mdx'
import Link from '~/site/docs-shell/components/Link'

import AppearanceControl from '../../components/AppearanceControl'
import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import { DemoBadge, DemoItem } from '~/site/components/demo'
import './page.css'

export { metadata }

const badges = [
  { label: 'Subject', tone: 'blue', variant: 'soft' },
  { label: 'Comparison', tone: 'violet', variant: 'outline' },
  { label: 'Selected', tone: 'blue', variant: 'solid' },
  { label: 'Informational note', tone: 'neutral', variant: 'ghost' }
] as const

function BadgeSpecimen() {
  return <div className="review-badge-specimens">
    {badges.map(({ label, tone, variant }) => <div key={label} className="review-badge-specimen">
      <DemoBadge tone={tone} variant={variant}>{label}</DemoBadge>
      <DemoItem className="review-badge-object">{label} surface</DemoItem>
    </div>)}
  </div>
}

const options = [
  {
    number: '01', note: 'A smaller radius, balanced padding and tabular monospace type keep the chip crisp across tones and sizes.',
    preview: <Demo><BadgeSpecimen /></Demo>
  }
] as const

export default function Page() {
  return <main className="ds-component-page review-badge-review">
    <ReviewNavigation />
    <h1>Demo badge</h1>
    <p className="review-badge-intro">A smaller radius, balanced padding and tabular monospace type keep the chip crisp across tones and sizes.</p>

    <AppearanceControl label="Preview theme" />

    <section aria-labelledby="badge-options">
      <h2 id="badge-options">State labels beside an object</h2>

      <div className="review-badge-options">
        {options.map(({ number, note, preview }) => <article className="review-badge-option" key={number}>
          <div className="review-badge-optionPreview">{preview}</div>
          <p className="review-badge-optionNote">{note}</p>
        </article>)}
      </div>
    </section>

    <section aria-labelledby="badge-scale">
      <h2 id="badge-scale">Size and long-text states</h2>
      <Demo>
        <div className="review-badge-scale">
          {(['xs', 'sm', 'md', 'lg'] as const).map(size => <div key={size}><span>{size}</span><DemoBadge size={size} tone="blue">Selected layer 24</DemoBadge></div>)}
          <div><span>wrap</span><DemoBadge tone="violet" variant="outline" className="review-badge-longBadge">comparison at a narrow viewport</DemoBadge></div>
        </div>
      </Demo>
      <p className="review-badge-optionNote">The chip has no hover behavior or focus stop. The long label wraps instead of forcing horizontal overflow.</p>
    </section>

    <section aria-labelledby="badge-real-use">
      <div className="review-badge-sectionHeading">
        <div><h2 id="badge-real-use">Actual Reference scene</h2><p>Border color uses direct subject and comparison labels with the real Master CSS classes.</p></div>
        <Link href="/reference/tokens/color">Open /reference/tokens/color</Link>
      </div>
      <DemoExample page="border-color" section="set-border-color" />
      <p className="review-badge-optionNote">The reference keeps its own teaching labels. A badge may name an adjacent category, but it must stay outside any measured border layout.</p>
    </section>
  <section className="ds-component-api prose" aria-labelledby="component-interface"><h2 id="component-interface">Usage and interface</h2><ComponentDocumentation /></section>
    </main>
}
