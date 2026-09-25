import Link from 'next/link'
import OriginalDemo from '~/site/docs-shell/components/Demo'
import OriginalDemoLabel from '~/site/docs-shell/components/DemoLabel'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import Demo from '~/site/components/demo/Demo'
import DemoExample from '~/site/components/demo/DemoExample'
import { DemoBadge, DemoItem } from '~/site/components/demo'
import './page.css'

export const metadata = {
  title: 'Demo badge review',
  description: 'The original Guide label pattern, current shared badge and a refined candidate.'
}

const badges = [
  { label: 'Subject', tone: 'blue', variant: 'soft' },
  { label: 'Comparison', tone: 'violet', variant: 'outline' },
  { label: 'Selected', tone: 'blue', variant: 'solid' },
  { label: 'Informational note', tone: 'neutral', variant: 'ghost' }
] as const

function BadgeSpecimen({ previous = false }: { previous?: boolean }) {
  return <div className="review-badge-specimens">
    {badges.map(({ label, tone, variant }) => <div key={label} className="review-badge-specimen">
      <DemoBadge tone={tone} variant={variant} className={previous ? 'review-badge-previousBadge' : undefined}>{label}</DemoBadge>
      <DemoItem className="review-badge-object">{label} surface</DemoItem>
    </div>)}
  </div>
}

function OriginalSpecimen() {
  return <div className="review-badge-specimens">
    {badges.map(({ label }) => <div key={label} className="review-badge-specimen">
      <OriginalDemoLabel>{label}</OriginalDemoLabel>
      <div className={`app-box review-badge-originalObject`}>{label} surface</div>
    </div>)}
  </div>
}

const options = [
  {
    number: '01', title: 'Original Guide', detail: 'Plain labels above specimens',
    note: 'The Guide uses small text labels, without a standalone state badge. Its demo and object styling remain unchanged.',
    preview: <OriginalDemo><OriginalSpecimen /></OriginalDemo>
  },
  {
    number: '02', title: 'Previous', detail: 'Earlier shared badge',
    note: 'The current badge inherits item paint and has a compact, font-relative inset.',
    preview: <Demo><BadgeSpecimen previous /></Demo>
  },
  {
    number: '03', title: 'Adopted', detail: 'Precise state annotation',
    note: 'A smaller radius, balanced padding and tabular monospace type keep the chip crisp across tones and sizes.',
    preview: <Demo><BadgeSpecimen /></Demo>
  }
] as const

export default function Page() {
  return <main className="review-badge-review">
    <div className="review-badge-kicker">Design system · Component review 24</div>
    <h1>Demo badge</h1>
    <p className="review-badge-intro">A badge identifies a state or category beside a specimen. It is static text, so an action still needs a real button or link. The adopted treatment keeps the Guide’s restrained annotation style and sharpens the shared badge.</p>
    <div className="review-badge-reviewNote" role="note">Adopted direction: the shared badge has a smaller radius and balanced monospace inset. The original Guide remains unchanged.</div>
    <label htmlFor="badge-review-theme" className="review-badge-themeControl"><span>Preview theme</span><span className="review-badge-themeSelect">Light · Dark · System<ThemeSelect id="badge-review-theme" aria-label="Preview theme" /></span></label>

    <section aria-labelledby="badge-options">
      <h2 id="badge-options">State labels beside an object</h2>
      <p className="review-badge-sectionCopy">All three treatments use the same subject and comparison content. Labels sit outside the objects being demonstrated.</p>
      <div className="review-badge-options">
        {options.map(({ number, title, detail, note, preview }) => <article className="review-badge-option" key={number}>
          <div className="review-badge-optionHeading"><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div></div>
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
        <Link href="/reference/border-color#set-border-color">Open /reference/border-color</Link>
      </div>
      <DemoExample page="border-color" section="set-border-color" />
      <p className="review-badge-optionNote">The reference keeps its own teaching labels. A badge may name an adjacent category, but it must stay outside any measured border layout.</p>
    </section>
  </main>
}
