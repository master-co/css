import type { HomeIconDefinition } from '~/site/assets/images/home/icons/catalog'
import { homeIconGroups, homeIcons } from '~/site/assets/images/home/icons/catalog'
import ThemeModes from '~/site/assets/images/home/icons/design-theme-modes.svg'
import CascadeLayers from '~/site/assets/images/home/icons/design-cascade-layers.svg'
import ScanCompact from '~/site/assets/images/home/icons/mcp-scan-project-compact.svg'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import ThemeIcon from '~/site/docs-shell/components/ThemeIcon'
import './page.css'

// Inline metadata keeps this handoff page out of the documentation category catalog.
export const metadata = {
  title: 'Homepage icons — Master CSS',
  description: '41 original line illustrations and 15 compact variants for the Master CSS homepage.',
  robots: { index: false, follow: false }
}

const specimenIds = ['design-theme-modes', 'design-p3-gamut', 'design-cascade-layers', 'editor-hover-inspection', 'render-progressive', 'mcp-scan-project']
const specimens = specimenIds.map(id => homeIcons.find(icon => icon.id === id)!)

const decorativeExample = `import ThemeModes from '~/site/assets/images/home/icons/design-theme-modes.svg'

<ThemeModes width={80} height={80} aria-hidden="true" focusable="false" />`

const compactExample = `import Scan from '~/site/assets/images/home/icons/mcp-scan-project-compact.svg'

<span className="tool-label">
  <Scan width={32} height={32} aria-hidden="true" focusable="false" />
  <span>Scan project</span>
</span>`

const accessibleExample = `<ThemeModes
  width={80}
  height={80}
  role="img"
  aria-label="Light and dark modes share the same markup"
  focusable="false"
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
      <p className="hir-lead">Original line illustrations for the Master CSS homepage. Soft corners, light strokes, and just enough perspective to explain how things fit together.</p>
      <div className="hir-facts" aria-label="Collection specifications">
        <span><strong>41</strong> original themes</span>
        <span><strong>15</strong> compact redraws</span>
        <span><strong>SVG</strong> single-color vectors</span>
      </div>
      <div className="hir-specimens" aria-label="Six representative illustrations">
        {specimens.map(({ id, label, Icon }) => <figure key={id}>
          <Icon width={96} height={96} aria-hidden="true" focusable="false" />
          <figcaption>{label}</figcaption>
        </figure>)}
      </div>
    </header>

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
        <div><h2 id="placement-heading">In context</h2><p>Suggested spacing at actual display sizes. Homepage layout remains with its designer.</p></div>
      </div>
      <div className="hir-placement-grid">
        <article className="hir-placement-card">
          <ThemeModes width={80} height={80} aria-hidden="true" focusable="false" />
          <div><h3>Light and dark, same markup</h3><p>Modes swap token values, not class names.</p></div>
        </article>
        <article className="hir-placement-card">
          <CascadeLayers width={80} height={80} aria-hidden="true" focusable="false" />
          <div><h3>Native CSS, in predictable layers</h3><p>One deliberate order from theme to utilities.</p></div>
        </article>
      </div>
      <div className="hir-tool-row">
        <ScanCompact width={32} height={32} aria-hidden="true" focusable="false" />
        <div><strong>Scan project</strong><code>mastercss_scan_project</code></div>
        <span>32px compact</span>
      </div>
    </section>

    <section className="hir-group hir-handoff" id="handoff" aria-labelledby="handoff-heading">
      <div className="hir-group-heading">
        <span className="hir-number">10</span>
        <div><h2 id="handoff-heading">Ready for integration</h2><p>Import the SVG for the placement you need. Color follows the surrounding text.</p></div>
      </div>
      <div className="hir-handoff-grid">
        <div>
          <h3>File and placement map</h3>
          <p>All drawings and the typed <code>catalog.ts</code> live in <code>site/assets/images/home/icons/</code>. Each card below its drawing names the exact SVG and its target section and item.</p>
          <p>The catalog exposes <code>homeIcons</code>, <code>homeIconGroups</code>, <code>HomeIconId</code> and <code>HomeIconDefinition</code>. Entries provide <code>target</code>, <code>placement</code>, <code>recommendedSize</code>, <code>Icon</code> and, for list items, <code>CompactIcon</code>.</p>
          <h3>Size and color</h3>
          <p>Main artwork: 96-unit canvas, softened corners, 1.6-unit outlines and 1.2-unit details; display at 64–96px. Compact artwork: a redrawn 32-unit canvas with 1.4-unit strokes; display at 24–40px. The recommended size refers to the compact version when one exists.</p>
          <p>Set CSS <code>color</code> on the inline SVG or its parent. Use the existing SVG component imports to inherit <code>currentColor</code>; an SVG loaded through an <code>img</code> element cannot inherit its parent’s text color.</p>
          <h3>Accessible use</h3>
          <p>Beside a visible heading, hide the decorative illustration from assistive technology. When it conveys information by itself, give the SVG a meaningful label. No embedded IDs, fonts, images, filters or animation are required.</p>
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
      <div className="hir-light"><Icon width={80} height={80} aria-hidden="true" focusable="false" /><span>Light</span></div>
      <div className="hir-dark"><Icon width={80} height={80} aria-hidden="true" focusable="false" /><span>Dark</span></div>
    </div>
    <div className="hir-card-copy">
      <div className="hir-card-title"><h3>{label}</h3>{CompactIcon && <span className="hir-badge">+ compact</span>}</div>
      <p>{concept}</p>
      <code className="hir-filename">{id}.svg</code>
      <dl className="hir-target"><div><dt>Section</dt><dd><a href={`/#${target.section}`}>{target.section}</a></dd></div>
        {target.item && <div><dt>Item</dt><dd>{target.item}</dd></div>}
        <div><dt>Suggested</dt><dd>{recommendedSize}px{CompactIcon ? ' compact' : ' main'}</dd></div>
      </dl>
    </div>
    <details className="hir-size-details">
      <summary>Actual sizes{CompactIcon ? ' · main + compact' : ''}</summary>
      <SizeStrip Icon={Icon} sizes={[64, 80, 96]} label="Main artwork" />
      {CompactIcon && <>
        <SizeStrip Icon={CompactIcon} sizes={[24, 32, 40]} label="Compact redraw" />
        <code className="hir-compact-filename">{id}-compact.svg</code>
      </>}
    </details>
  </article>
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
