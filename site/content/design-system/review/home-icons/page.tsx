import type { HomeIconDefinition } from '~/site/assets/images/home/icons/catalog'
import { homeIconGroups, homeIcons } from '~/site/assets/images/home/icons/catalog'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import ThemeIcon from '~/site/docs-shell/components/ThemeIcon'
import MaterialStudy from './MaterialStudy'
import Artwork from './Artwork'
import ContextPreview from './ContextPreview'
import './page.css'

// Inline metadata keeps this handoff page out of the documentation category catalog.
export const metadata = {
  title: 'Homepage icons — Master CSS',
  description: '41 translucent illustrations in light and dark WebP variants, with archived SVG construction studies.',
  robots: { index: false, follow: false }
}

const specimenIds = ['design-theme-modes', 'design-p3-gamut', 'design-cascade-layers', 'editor-hover-inspection', 'render-progressive', 'mcp-scan-project']
const specimens = specimenIds.map(id => homeIcons.find(icon => icon.id === id)!)

const decorativeExample = `import Image from '~/site/docs-shell/components/Image'
import light from '~/site/assets/images/home/icons/artwork/design-theme-modes-light.webp'
import dark from '~/site/assets/images/home/icons/artwork/design-theme-modes-dark.webp'
import '~/site/assets/images/home/icons/artwork.css'

<span aria-hidden="true">
  <Image src={light} width={96} height={96} alt=""
    className="home-icon-artwork display:none@apply(--site-dark)" />
  <Image src={dark} width={96} height={96} alt=""
    className="home-icon-artwork display:none@apply(--site-light)" />
</span>`

const compactExample = `import HomeCompactIcon from '~/site/content/components/HomeCompactIcon'

// Server-rendered light/dark artwork, passed into the agent island as a slot.
<span className="home-agent-call-icon">
  <HomeCompactIcon icon="mcp-scan-project" />
</span>`

const accessibleExample = `// Use the matching theme asset. Give informative images an alt.
<Image
  src={light}
  className="home-icon-artwork"
  width={96}
  height={96}
  alt="Light and dark modes share the same markup"
/>`

export default function Page() {
  return <main className="home-icon-review" id="home-icon-top">
    <header className="hir-intro">
      <div className="hir-topline">
        <a href="/design-system">Master CSS / Design system</a>
        <span>Illustration collection · 01</span>
      </div>
      <p className="hir-eyebrow">Quiet precision</p>
      <h1>A little depth.<br /><span>A clear purpose.</span></h1>
      <p className="hir-lead">Original illustrations for the Master CSS homepage. Transparent planes, restrained light, and fine lines describe each mechanism. The same glass artwork now carries through to lint rules and agent tools.</p>
      <div className="hir-facts" aria-label="Collection specifications">
        <span><strong>41</strong> original themes</span>
        <span><strong>15</strong> archived compact studies</span>
        <span><strong>WebP</strong> homepage feature artwork</span>
      </div>
      <div className="hir-specimens" aria-label="Six representative illustrations">
        {specimens.map(entry => <figure key={entry.id}>
          <Artwork entry={entry} size={96} />
          <figcaption>{entry.label}</figcaption>
        </figure>)}
      </div>
    </header>

    <MaterialStudy />

    <div className="hir-toolbar">
      <p>Explore the collection</p>
      <div className="hir-appearance">Page theme<span>
        <ThemeSelect aria-label="Page theme" />
        <ThemeIcon width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
        <span aria-hidden="true">⌄</span>
      </span></div>
    </div>
    <nav className="hir-index" aria-label="Icon groups">
      {homeIconGroups.map(({ id, label }, index) => <a key={id} href={`#${id}`}>
        <span>{String(index + 1).padStart(2, '0')}</span>{label}
        <span>{homeIcons.filter(icon => icon.group === id).length}</span>
      </a>)}
      <a href="#placement"><span>09</span>In context<span>↗</span></a>
      <a href="#handoff"><span>10</span>Integration<span>↗</span></a>
    </nav>

    {homeIconGroups.map(({ id, label, description }, index) => <section className="hir-group" id={id} key={id} aria-labelledby={`${id}-heading`}>
      <div className="hir-group-heading">
        <span className="hir-number">{String(index + 1).padStart(2, '0')}</span>
        <div><h2 id={`${id}-heading`}>{label}</h2><p>{description}</p></div>
        <span className="hir-count">{homeIcons.filter(icon => icon.group === id).length} themes</span>
      </div>
      <div className="hir-grid">
        {homeIcons.filter(icon => icon.group === id).map(entry => <IconCard key={entry.id} entry={entry} />)}
      </div>
    </section>)}

    <section className="hir-group" id="placement" aria-labelledby="placement-heading">
      <div className="hir-group-heading">
        <span className="hir-number">09</span>
        <div><h2 id="placement-heading">Placement studies</h2><p>The full collection with current homepage copy where available, shown at 96px, 48px and 40px.</p></div>
      </div>
      <ContextPreview />
    </section>

    <section className="hir-group hir-handoff" id="handoff" aria-labelledby="handoff-heading">
      <div className="hir-group-heading">
        <span className="hir-number">10</span>
        <div><h2 id="handoff-heading">Homepage integration</h2><p>The current rc layout uses themed WebP artwork throughout its section, card, rule and tool illustrations.</p></div>
      </div>
      <div className="hir-handoff-grid">
        <div>
          <h3>File and placement map</h3>
          <p>The current homepage uses 34 subjects across section headings, bento cards, editor features, rendering modes, lint rules and agent tool calls. The three former AI card illustrations and four tools absent from the current agent session remain available in this 41-subject catalog.</p>
          <p>All assets and the typed <code>catalog.ts</code> live in <code>site/assets/images/home/icons/</code>. The <code>artwork/</code> directory contains 41 light/dark WebP pairs. Each catalog entry names its exact homepage section and item.</p>
          <p>The catalog exposes <code>homeIcons</code>, <code>homeIconGroups</code>, <code>HomeIconId</code> and <code>HomeIconDefinition</code>. Entries provide <code>target</code>, <code>placement</code>, <code>recommendedSize</code> and themed <code>artwork.light</code> and <code>artwork.dark</code>. The <code>Icon</code> and optional <code>CompactIcon</code> fields retain the editable vector construction studies.</p>
          <h3>Size and color</h3>
          <p>Homepage section headings use 64–80px artwork, bento cards use 112px (7rem), lint rules use 48px artwork and dense agent call rows use 40px artwork. Bento titles and descriptions stay together on the left, with 24–48px of space before the illustration on the right. Card titles link directly to their guides.</p>
          <p>All homepage feature artwork uses transparent 384 × 384 WebP exports, reviewed at 40/48/64/80/96/112px. Each lighting pair shares the same optical crop. The earlier 32-unit SVG redraws remain below as construction studies; the recommended sizes now refer to WebP artwork.</p>
          <p>Keep each image square and set explicit width and height. Its transparent spacing includes optical adjustments for alignment with headings and neighboring icons. Do not add CSS inversion, blend modes or extra shadows to the WebP artwork.</p>
          <p>WebP artwork uses separate light and dark lighting; the existing site theme selectors choose the matching image without new browser logic. Import <code>artwork.css</code> and apply <code>home-icon-artwork</code> to each image to remove the blue cast with <code>grayscale(1)</code>, matching the neutral zinc palette while preserving transparency and luminance. <code>HomeCompactIcon</code> shares the same artwork renderer for list items.</p>
          <h3>Source and material</h3>
          <p>The WebP artwork was created with the built-in image generation tool. <code>artwork/source.json</code> records the subject briefs, material prompt, lighting edit and export settings. The material study above preserves the same-size SVG/WebP comparison.</p>
          <h3>Accessible use</h3>
          <p>Beside a visible heading, give decorative images an empty alt and hide their wrapper from assistive technology. For an informative image, provide a meaningful alt; for a standalone compact SVG, provide an accessible name. SVGs contain no IDs, embedded images, external resources or animation.</p>
        </div>
        <div className="hir-examples">
          <CodeExample label="Beside a heading" code={decorativeExample} />
          <CodeExample label="In a dense tool list" code={compactExample} />
          <CodeExample label="When the image carries meaning" code={accessibleExample} />
        </div>
      </div>
    </section>
    <footer className="hir-footer"><span>Master CSS · Original homepage illustrations</span><a href="#home-icon-top">Back to top ↑</a></footer>
  </main>
}

function IconCard({ entry }: { entry: HomeIconDefinition }) {
  const { id, label, concept, target, Icon, CompactIcon, recommendedSize } = entry
  return <article className="hir-card" id={id}>
    <div className="hir-pair" aria-label="Light and dark background previews">
      <div className="hir-light"><Artwork entry={entry} size={96} theme="light" /><span>Light</span></div>
      <div className="hir-dark"><Artwork entry={entry} size={96} theme="dark" /><span>Dark</span></div>
    </div>
    <div className="hir-card-copy">
      <div className="hir-card-title"><h3>{label}</h3>{CompactIcon && <span className="hir-badge">SVG study</span>}</div>
      <p>{concept}</p>
      <code className="hir-filename">artwork/{id}-&#123;light,dark&#125;.webp</code>
      <dl className="hir-target"><div><dt>Section</dt><dd><a href={`/#${target.section}`}>{target.section}</a></dd></div>
        {target.item && <div><dt>Item</dt><dd>{target.item}</dd></div>}
        <div><dt>Suggested</dt><dd>{recommendedSize}px artwork</dd></div>
      </dl>
    </div>
    <details className="hir-size-details">
      <summary>Actual sizes{CompactIcon ? ' · artwork + SVG study' : ''}</summary>
      <ArtworkSizeStrip entry={entry} />
      {CompactIcon && <>
        <SizeStrip Icon={CompactIcon} sizes={[24, 32, 40]} label="Archived compact SVG" />
        <code className="hir-compact-filename">{id}-compact.svg</code>
      </>}
    </details>
    <details className="hir-construction-details hir-size-details">
      <summary>Material and vector construction · enlarged</summary>
      <div className="hir-construction-view">
        <Artwork entry={entry} size={240} />
        <span>Selected WebP material</span>
        <Icon width={240} height={240} aria-hidden="true" focusable="false" />
        <span>{id}.svg · vector construction</span>
      </div>
      {CompactIcon && <div className="hir-construction-compact hir-construction-view">
        <CompactIcon width={128} height={128} aria-hidden="true" focusable="false" />
        <span>Compact drawing · 4×</span>
      </div>}
    </details>
  </article>
}

function ArtworkSizeStrip({ entry }: { entry: HomeIconDefinition }) {
  return <div className="hir-size-strip">
    <p>Main artwork · WebP</p>
    {(['light', 'dark'] as const).map(theme => <div className={`hir-size-row hir-${theme}`} key={theme} aria-label={`Main artwork on ${theme}`}>
      {(entry.placement === 'item' ? [40, 48, 64] : [64, 80, 96, 112]).map(size => <figure key={size}>
        <Artwork entry={entry} size={size} theme={theme} />
        <figcaption>{size}px</figcaption>
      </figure>)}
    </div>)}
  </div>
}

function SizeStrip({ Icon, sizes, label }: { Icon: HomeIconDefinition['Icon'], sizes: readonly number[], label: string }) {
  return <div className="hir-size-strip">
    <p>{label}</p>
    {['light', 'dark'].map(scheme => <div className={`hir-size-row hir-${scheme}`} key={scheme} aria-label={`${label} on ${scheme}`}>
      {sizes.map(size => <figure key={size}>
        <Icon width={size} height={size} aria-hidden="true" focusable="false" />
        <figcaption>{size}px</figcaption>
      </figure>)}
    </div>)}
  </div>
}

function CodeExample({ label, code }: { label: string, code: string }) {
  return <figure className="hir-code-example"><figcaption>{label}</figcaption><pre><code>{code}</code></pre></figure>
}
