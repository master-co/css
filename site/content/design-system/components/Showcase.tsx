import '~/site/styles/system/specimens.css'
import '~/site/styles/system/data.css'
import '~/site/styles/documentation-index.css'
import { IconArrowUpRight } from '@tabler/icons-react'
import Code from '~/site/docs-shell/components/Code'
import CodeTabs from '~/site/docs-shell/components/CodeTabs'
import Link from '~/site/docs-shell/components/Link'
import Translate from '~/site/docs-shell/components/Translate'
import { Demo, DemoBadge, DemoGeneratedCSS, DemoItem, DemoLabel, DemoLegend, DemoSurface } from '~/site/components/demo'
import DemoCopyButton from '~/site/components/demo/DemoCopyButton'
import DemoViewport from '~/site/components/demo/DemoViewport'
import DemoTokenTable from '~/site/components/demo/DemoTokenTable'
import { projectStyleExample, projectTokenDefinitions } from '~/site/components/demo/project-style-examples'
import { demoDocument } from '~/site/components/demo/reference/document'
import { configuredExampleCSS, configuredMarkupClasses } from '~/site/reference/configured-example'
import { ControlsGallery } from '../review/controls/ControlsReviewScene'
import { componentGroups, elevationSteps, materialRoles, recipeGroups } from './catalog'

export function Workbench() {
  const example = projectStyleExample('tokens')
  const document = demoDocument({ page: 'design-system', id: 'workbench', title: example.title, html: [example.html], css: example.source, classes: [], classLists: [], highlighted: [] }, {
    html: example.html, bodyClass: 'p-lg bg-surface-base fg-text-body', caption: ''
  })
  return <>
    <h2 id="workspace"><Translate>A small document workspace</Translate></h2>
    <div className="ui-handbook-section">
      <Demo title={example.title} frame="none" caption={<Translate>The responsive preview and its source use the same project token definitions.</Translate>} source={<>
        <CodeTabs>{[
          { name: 'collection.html', lang: 'html', code: example.html, beautify: true },
          { name: 'theme.css', lang: 'css', code: example.source },
        ]}</CodeTabs>
        <DemoGeneratedCSS><Code lang="css" beautify>{configuredExampleCSS(example.source, configuredMarkupClasses(example.html))}</Code></DemoGeneratedCSS>
      </>}>
        <DemoViewport title="Collection card" document={document} responsive sizing="content" maxWidth={1000} />
      </Demo>
      <dl className="ui-params" aria-label="Project tokens">
        {projectTokenDefinitions.map(token => <div key={token.name}><dt>{token.name}</dt><dd><code>{token.value}</code></dd></div>)}
      </dl>
    </div>
  </>
}

/** The ladder from page to overlay, the elevation order and the concentric radii. */
export function Materials() {
  return <div className="ui-handbook-section">
    <div className="grid-cols(2) gap-sm grid-cols(3)@sm">
      {materialRoles.map(role => <figure className="ui-swatch" key={role.name}>
        <div className="ui-swatch-paint" style={{ background: `var(${role.token})` }} aria-hidden="true" />
        <figcaption><b><Translate>{role.name}</Translate></b><code>{role.token}</code></figcaption>
      </figure>)}
    </div>
    <Demo title="Elevation" description="sink < flat < rise-1 < rise-1h < rise-2 < rise-3 < overlay" background="dots"
      caption={<Translate>Every layer doubles offset and blur while its spread pulls in. Hover lifts half a pixel to rise-1h; pressing sinks into the well.</Translate>}>
      <div className="grid-cols(2) gap-lg w-full grid-cols(4)@sm grid-cols(7)@md">
        {elevationSteps.map(step => <div key={step} className="grid (justify-items:center) gap-xs">
          <div className="r-md" style={{ width: '4rem', height: '4rem', background: step === 'sink' ? 'var(--ui-surface-well)' : 'var(--ui-surface-sheet)', boxShadow: `var(--ui-elevation-${step})` }} aria-hidden="true" />
          <DemoLabel>{step}</DemoLabel>
        </div>)}
      </div>
    </Demo>
    <Demo title="Concentric radii" description="3 · 4 · 6 · 8 · 10 · 14, nested by a 4px inset" caption={<Translate>A tray of 14 holds a stage, code window or sheet of 10 at a 4px inset; a menu of 8 holds items of 4.</Translate>}>
      <div className="w-full (max-width:22rem)" style={{ padding: 'var(--ui-inset)', borderRadius: 'var(--ui-radius-2xl)', background: 'var(--ui-surface-tray)', boxShadow: 'inset 0 0 0 1px var(--ui-line-hair)' }}>
        <DemoSurface elevation="raised" className="grid gap-sm p-lg" style={{ borderRadius: 'var(--ui-radius-xl)' }}>
          <DemoLabel>Tray 14 → sheet 10</DemoLabel>
          <div className="flex gap-xs">{[3, 4, 6, 8].map(radius => <DemoItem key={radius} className="min-w(0) p(0) font-xs" style={{ width: '3rem', height: '3rem', borderRadius: radius }}>{radius}</DemoItem>)}</div>
        </DemoSurface>
      </div>
    </Demo>
  </div>
}

export function Controls() {
  return <div className="ui-handbook-section">
    <ControlsGallery />
    <Demo title="Copy with an honest result" padding="sm" caption={<Translate>The status beside the action reports the real clipboard result, including denial.</Translate>}>
      <DemoCopyButton value="var(--ui-surface-sheet)" label="Copy the sheet surface variable"><Translate>Copy surface</Translate></DemoCopyButton>
    </Demo>
  </div>
}

export function DocumentPatterns() {
  return <div className="ui-handbook-section" data-columns="2">
    <Demo id="values-together" title="Values, together" frame="none" caption={<Translate>Names, values and supporting details share a start.</Translate>}>
      <DemoTokenTable rows={projectTokenDefinitions.map(token => ({ token: token.name, utilities: [], value: token.value, description: token.name.includes('spacing') ? 'Shared card padding' : token.name.includes('radius') ? 'Shared card corners' : 'An existing semantic color' }))} />
    </Demo>
    <Demo title="Teaching color is always named" padding="sm" caption={<Translate>Hue appears only inside specimens. A legend or label names each tone.</Translate>}>
      <div className="grid (justify-items:center) gap-md">
        <div className="flex gap-sm"><DemoItem>Context</DemoItem><DemoItem tone="blue">Subject</DemoItem><DemoItem tone="violet">Comparison</DemoItem></div>
        <DemoLegend items={[{ label: 'Context', tone: 'neutral' }, { label: 'Subject', tone: 'blue' }, { label: 'Comparison', tone: 'violet' }]} />
        <div className="flex flex-wrap gap-xs"><DemoBadge variant="dot" tone="green">Supported</DemoBadge><DemoBadge>Static</DemoBadge></div>
      </div>
    </Demo>
  </div>
}

/** The component pages as a book's contents, like the Guide and Reference overviews: ruled spreads, not a wall of cards. */
export function ComponentCatalog() {
  return <div className="documentation-index">
    {componentGroups.map((group, index) => <section className="documentation-index-section" id={group.id} key={group.title} aria-labelledby={`${group.id}-title`}>
      <header>
        <small>{String(index + 1).padStart(2, '0')}</small>
        <h3 id={`${group.id}-title`}><Translate>{group.title}</Translate> <span className="documentation-index-count">{group.entries.length}</span></h3>
      </header>
      <ul className="documentation-index-links" data-described="">{group.entries.map(entry => <li key={entry.slug}><Link id={entry.id} href={`/design-system/review/${entry.slug}`}>
        <b><Translate>{entry.title}</Translate></b><span><Translate>{entry.description}</Translate></span>
      </Link></li>)}</ul>
    </section>)}
  </div>
}

export function RecipeCatalog() {
  return <nav className="flex flex-wrap gap-xs" aria-label="Working recipe collections">{recipeGroups.map(group => <Link key={group.id} id={group.id} className="ui-button" data-size="sm" href={`/design-system/authoring#${group.id}`}><Translate>{group.title}</Translate><IconArrowUpRight aria-hidden="true" /></Link>)}</nav>
}
