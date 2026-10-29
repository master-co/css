import { homeIcons } from '~/site/assets/images/home/icons/catalog'
import type { HomeIconDefinition } from '~/site/assets/images/home/icons/catalog'
import { designSystemTiles, designSystemPalette, deliveryModes, workflowCards } from '~/site/content/components/home-content'
import { editorFeatures } from '~/site/content/components/editor-content'
import Artwork from './Artwork'

const editorItems = { complete: 'manifest-aware-suggestions', hover: 'hover-inspection', highlight: 'active-syntax-highlighting', color: 'color-tools' } as const

const sections = [
  ['design-system', 'Design system', 'Build modern interfaces from one class vocabulary.'],
  ['language-service', 'Editor', 'Dense class strings, still readable.'],
  ['delivery-modes', 'Rendering', 'One syntax. Every delivery path.'],
  ['css-cost', 'CSS size', 'Only the CSS a page uses.'],
  ['code-diagnostics', 'Lint', 'Lint classes against your project.'],
  ['ai-agents', 'AI agents', 'Agents check their own changes.'],
  ['development-workflow', 'Workflow', 'Works with your framework and build.'],
] as const

const copy = new Map<string, { title: string, body: string }>([
  ...editorFeatures.map(card => [editorItems[card.id], card] as const),
  ...deliveryModes.map(mode => [mode.id, mode] as const),
  ...Object.entries(workflowCards),
  ['agent-session', { title: 'Lint, preview, then apply', body: 'An agent lints what it wrote, previews the fixes as a diff, and applies them only if the files have not changed since.' }],
  ['mcp-clients', { title: 'Works with your agent', body: 'Any MCP client that runs local stdio servers, from Claude Code and Codex to Cursor and Zed.' }],
  ['mcp-tools', { title: 'Project tools', body: 'Each tool reads the same manifest and rules as your build, and none of them writes without a confirmed preview.' }],
])

for (const tile of designSystemTiles) copy.set(tile.visual, tile)
copy.set('p3-palette', designSystemPalette)

/** Current homepage copy where available; the full collection also keeps artwork for other placements. */
export default function ContextPreview() {
  return <div className="hir-context-sections">
    {sections.map(([id, label, title], index) => {
      const mark = homeIcons.find(icon => icon.target.section === id && icon.placement === 'section')!
      const items: readonly HomeIconDefinition[] = homeIcons.filter(icon => icon.target.section === id && icon.placement !== 'section')
      return <section className="hir-context-section" key={id} aria-labelledby={`context-${id}`}>
        <header className="hir-context-header">
          <Artwork entry={mark} size={96} />
          <div><p>{String(index + 1).padStart(2, '0')} — {label}</p><h3 id={`context-${id}`}>{title}</h3></div>
        </header>
        <div className="hir-placement-grid">
          {items.map(entry => {
            const content = copy.get(entry.target.item!) ?? { title: entry.label, body: entry.concept }
            return <article key={entry.id} className={`hir-placement-card${entry.placement === 'item' ? ' hir-placement-compact' : ''}`}>
              <Artwork entry={entry} size={entry.recommendedSize} />
              <div><h4>{content.title}</h4><p>{content.body}</p></div>
            </article>
          })}
        </div>
      </section>
    })}
  </div>
}
