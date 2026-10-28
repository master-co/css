import { IconArrowUpRight, IconStack2, IconNotebook } from '@tabler/icons-react'
import CodeTabs from '~/site/docs-shell/components/CodeTabs'
import Link from '~/site/docs-shell/components/Link'
import Translate from '~/site/docs-shell/components/Translate'
import DocumentDisclosure from '~/site/components/DocumentDisclosure'
import { Demo, DemoItem, DemoLabel, DemoSurface } from '~/site/components/demo'
import DemoCopyButton from '~/site/components/demo/DemoCopyButton'
import DemoViewport from '~/site/components/demo/DemoViewport'
import DemoTokenTable from '~/site/components/demo/DemoTokenTable'
import { projectStyleExample, projectTokenDefinitions } from '~/site/components/demo/project-style-examples'
import { demoDocument } from '~/site/components/demo/reference/document'
import { configuredExampleCSS, configuredMarkupClasses } from '~/site/reference/configured-example'
import ControlsReviewScene from '../review/controls/ControlsReviewScene'
import { componentGroups, materialRoles, recipeGroups } from './catalog'
import AppearanceControl from './AppearanceControl'

export function Workbench() {
  const example = projectStyleExample('tokens')
  const document = demoDocument({ page: 'design-system', id: 'workbench', title: example.title, html: [example.html], css: example.source, classes: [], classLists: [], highlighted: [] }, {
    html: example.html, bodyClass: 'p-lg bg-surface-base fg-text-body', caption: ''
  })
  return <div className="ds-workbench">
    <div className="ds-workbench-heading">
      <div><span className="ds-eyebrow"><IconNotebook size={14} aria-hidden="true" /><Translate>In context</Translate></span><h2 id="workspace"><Translate>A small document workspace</Translate></h2></div>
      <AppearanceControl />
    </div>
    <div className="ds-workbench-grid">
      <div className="ds-workbench-preview">
        <DemoViewport title="Collection card" document={document} responsive sizing="content" maxWidth={1000} />
        <CodeTabs>{[
          { name: 'collection.html', lang: 'html', code: example.html, beautify: true },
          { name: 'theme.css', lang: 'css', code: example.source },
          { name: 'Generated CSS', lang: 'css', code: configuredExampleCSS(example.source, configuredMarkupClasses(example.html)) }
        ]}</CodeTabs>
      </div>
      <aside className="ds-token-panel" aria-label="Project tokens">
        <div className="ds-panel-heading"><IconStack2 size={16} aria-hidden="true" /><h3><Translate>Project tokens</Translate></h3></div>
        <dl>{projectTokenDefinitions.map(token => <div key={token.name}><dt><code>{token.name}</code></dt><dd><code>{token.value}</code></dd></div>)}</dl>
        <p><Translate>The preview and source use these same definitions.</Translate></p>
        <Link href="/guide/theme"><Translate>Read the theme lesson</Translate><IconArrowUpRight size={14} aria-hidden="true" /></Link>
      </aside>
    </div>
  </div>
}

export function Materials() {
  return <div className="ds-materials">
    <div className="ds-material-assembly">
      <div className="ds-material-sheet">
        <span className="ds-eyebrow"><Translate>Shared surfaces</Translate></span>
        <h3><Translate>Close at the edges. Open around the content.</Translate></h3>
        <p><Translate>An eight-pixel surround seats the panel. The content keeps its own breathing room.</Translate></p>
        <div className="ds-material-pair"><DemoSurface className="ds-material-example"><DemoLabel>Flat</DemoLabel><strong>Reading surface</strong></DemoSurface><DemoSurface elevation="raised" className="ds-material-example"><DemoLabel>Raised</DemoLabel><strong>Selected layer</strong></DemoSurface></div>
      </div>
    </div>
    <div className="ds-material-roles">{materialRoles.map(role => <div className="ds-material-role" key={role.name}><span className={role.className} aria-hidden="true" /><div><strong><Translate>{role.name}</Translate></strong><code>{role.token}</code><p><Translate>{role.description}</Translate></p></div></div>)}</div>
  </div>
}

export function Controls() {
  return <div className="ds-controls-showcase">
    <ControlsReviewScene />
    <div className="ds-control-footnote"><div><strong><Translate>A state has a place</Translate></strong><p><Translate>The selected insert stays fitted to its track. Pressing changes the surface, while labels and icons keep their positions.</Translate></p></div><DemoCopyButton value="var(--color-surface-raised)" label="Copy the raised surface variable"><Translate>Copy surface</Translate></DemoCopyButton></div>
  </div>
}

export function DocumentPatterns() {
  return <div className="ds-document-patterns">
    <div>
      <Demo id="values-together" title="Values, together" padding="none" frame="none">
        <DemoTokenTable rows={projectTokenDefinitions.map(token => ({ token: token.name, utilities: [], value: token.value, description: token.name.includes('spacing') ? 'Shared card padding' : token.name.includes('radius') ? 'Shared card corners' : 'An existing semantic color' }))} />
      </Demo>
    </div>
    <div className="ds-document-note">
      <DemoItem className="ds-note-heading"><span className="ds-note-dot" aria-hidden="true" /><strong><Translate>Keep the explanation nearby</Translate></strong></DemoItem>
      <p><Translate>Names, values and supporting details share a start. Longer source stays available in a native disclosure.</Translate></p>
      <DocumentDisclosure title="A small composition">
        <CodeTabs>{[{ name: 'example.tsx', lang: 'tsx', code: '<Demo title="Collection" background="plain">\n  <DemoSurface className="p-lg">\n    Room for the details.\n  </DemoSurface>\n</Demo>' }]}</CodeTabs>
      </DocumentDisclosure>
      <Link className="ds-text-link" href="/design-system/authoring"><Translate>Build a complete example</Translate><IconArrowUpRight size={14} aria-hidden="true" /></Link>
    </div>
  </div>
}

export function ComponentCatalog() {
  return <div className="ds-component-catalog">
    {componentGroups.map(group => <section className="ds-component-group" id={group.id} key={group.title} aria-label={group.title}><h3><Translate>{group.title}</Translate></h3><ul>{group.entries.map(entry => <li key={entry.slug} id={entry.id}>
      <Link href={`/design-system/review/${entry.slug}`}><div><strong><Translate>{entry.title}</Translate></strong><span><Translate>{entry.description}</Translate></span></div><IconArrowUpRight size={15} aria-hidden="true" /></Link>
    </li>)}</ul></section>)}
  </div>
}

export function RecipeCatalog() {
  return <nav className="ds-recipe-links" aria-label="Working recipe collections">{recipeGroups.map(group => <Link key={group.id} id={group.id} href={`/design-system/authoring#${group.id}`}><Translate>{group.title}</Translate><IconArrowUpRight size={14} aria-hidden="true" /></Link>)}</nav>
}
