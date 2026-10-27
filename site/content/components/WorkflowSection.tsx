import './workflow.css'
import type { ComponentType, CSSProperties, SVGProps } from 'react'
import { IconBrandOpenai, IconCircleCheck, IconFileText, IconFolder, IconRoute } from '@tabler/icons-react'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import brands from '~/site/docs-shell/data/brands'
import claudeLogo from '~/site/assets/images/home/clients/claude.svg'
import clineLogo from '~/site/assets/images/home/clients/cline.svg'
import cursorLogo from '~/site/assets/images/home/clients/cursor.svg'
import copilotLogo from '~/site/assets/images/home/clients/githubcopilot.svg'
import geminiLogo from '~/site/assets/images/home/clients/googlegemini.svg'
import windsurfLogo from '~/site/assets/images/home/clients/windsurf.svg'
import zedLogo from '~/site/assets/images/home/clients/zedindustries.svg'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import { homeSections, impactCommand, mcpCommand, mcpToolNames, workflowCards } from './home-content'

type Logo = ComponentType<SVGProps<SVGSVGElement>>

const MasterCSSLogo = brands.mastercss.src

/** Tabler's outlined OpenAI mark, sized like the filled client logos. */
function OpenAILogo(props: SVGProps<SVGSVGElement>) {
  return <IconBrandOpenai {...(props as object)} size={24} stroke={1.5} />
}

/** MCP clients that run local stdio servers such as `@master/css-mcp`. */
const mcpClients: { name: string, Logo: Logo, color?: string }[] = [
  { name: 'Claude Code', Logo: claudeLogo, color: '#d97757' },
  { name: 'Codex', Logo: OpenAILogo },
  { name: 'Cursor', Logo: cursorLogo },
  { name: 'GitHub Copilot', Logo: copilotLogo },
  { name: 'Gemini CLI', Logo: geminiLogo, color: '#8e75b2' },
  { name: 'Windsurf', Logo: windsurfLogo },
  { name: 'Zed', Logo: zedLogo },
  { name: 'Cline', Logo: clineLogo }
]

const frameworkKeys = ['vite', 'astro', 'nextjs', 'nuxtjs', 'svelte', 'react-router', 'webpack', 'rspack', 'rsbuild', 'react', 'vuejs', 'angular', 'laravel', 'rails', 'lit', 'storybook'] as const

/** Impact graph nodes as [column, row percent, label, kind]. */
const impactNodes = [
  [0, 50, '--color-brand', 'definition'],
  [1, 30, 'bg-brand', 'utility'],
  [1, 70, 'fg-brand', 'utility'],
  [2, 18, 'Button.tsx', 'consumer'],
  [2, 50, 'Badge.tsx', 'consumer'],
  [2, 82, 'pricing.html', 'consumer'],
  [3, 50, 'app.css', 'output']
] as const

const impactEdges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [5, 6]] as const

const impactColumnX = [10, 36, 64, 90]

export default function WorkflowSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.developmentWorkflow} className="home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          index="06"
          label={$('Workflow')}
          title={$('Built into the tools you already use.')}
          body={$('Connect agents over MCP, see what a token change touches, and run the same lint rules in ESLint, CI and agent sessions.')} />
        <HomeBentoFrame>
          <HomeBentoGrid className="grid-cols(1) grid-cols(2)@md grid-cols(12)@lg">
            <HomeBentoCard className="grid-col-span(2)@md grid-col-span(7)@lg grid-row-span(2)@lg home-reveal-item" signal={$(workflowCards.mcp.signal)} title={$(workflowCards.mcp.title)} body={$(workflowCards.mcp.body)}>
              <McpHub />
            </HomeBentoCard>
            <HomeBentoCard className="grid-col-span(5)@lg home-reveal-item" signal={$(workflowCards.impact.signal)} title={$(workflowCards.impact.title)} body={$(workflowCards.impact.body)}>
              <ImpactGraph />
            </HomeBentoCard>
            <HomeBentoCard className="grid-col-span(5)@lg home-reveal-item" signal={$(workflowCards.frameworks.signal)} title={$(workflowCards.frameworks.title)} body={$(workflowCards.frameworks.body)}>
              <FrameworkMarquee />
            </HomeBentoCard>
            <HomeBentoCard className="grid-col-span(4)@lg home-reveal-item" signal={$(workflowCards.workspaces.signal)} title={$(workflowCards.workspaces.title)} body={$(workflowCards.workspaces.body)}>
              <WorkspaceTree />
            </HomeBentoCard>
            <HomeBentoCard className="grid-col-span(4)@lg home-reveal-item" signal={$(workflowCards.routes.signal)} title={$(workflowCards.routes.title)} body={$(workflowCards.routes.body)}>
              <RouteStyles />
            </HomeBentoCard>
            <HomeBentoCard className="grid-col-span(4)@lg home-reveal-item" signal={$(workflowCards.policy.signal)} title={$(workflowCards.policy.title)} body={$(workflowCards.policy.body)}>
              <PolicySurfaces />
            </HomeBentoCard>
          </HomeBentoGrid>
        </HomeBentoFrame>
      </div>
    </section>
  )
}

/** Clients orbit the server on a tilted plane; their faces counter-rotate so they always read upright. */
function McpHub() {
  const $ = useTranslation()
  return (
    <div className="home-bento-visual home-mcp">
      <p aria-hidden="true" className="home-annotation home-mcp-note">{$('Local stdio MCP clients')}</p>
      <div className="home-mcp-stage">
        <div className="home-mcp-orbit">
          <span aria-hidden="true" className="home-mcp-ring" />
          <span aria-hidden="true" className="home-mcp-ring home-mcp-ring-inner" />
          <ul aria-label={$('MCP clients')} className="home-mcp-spin">
            {mcpClients.map(({ color, name, Logo }, index) => (
              <li className="home-mcp-slot" key={name} style={{ '--home-orbit-angle': index * 360 / mcpClients.length } as CSSProperties}>
                <span aria-hidden="true" className="home-mcp-spoke" />
                <span className="home-mcp-face">
                  <span className="home-mcp-client-logo" style={color ? { '--home-brand': color } as CSSProperties : undefined}>
                    <Logo aria-hidden="true" height={22} width={22} />
                  </span>
                  <span className="home-mcp-client-name">{name}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="home-mcp-core">
            <MasterCSSLogo aria-hidden="true" height={34} width={34} />
            <span className="font-2xs font-semibold fg-text-strong">@master/css-mcp</span>
            <span className="home-status home-status-live">stdio</span>
          </div>
        </div>
      </div>
      <div className="home-mcp-footer">
        <div className="home-marquee" style={{ '--home-marquee-duration': '36s' } as CSSProperties}>
          <div className="home-marquee-track">
            {[0, 1].map((copy) => mcpToolNames.map((tool) => (
              <code aria-hidden={copy ? 'true' : undefined} className="home-chip" key={`${copy}-${tool}`}>{tool}</code>
            )))}
          </div>
        </div>
        <code className="home-terminal-line"><span aria-hidden="true" className="fg-text-muted">$</span> {mcpCommand}</code>
      </div>
    </div>
  )
}

function ImpactGraph() {
  const $ = useTranslation()
  const point = (index: number) => ({ x: impactColumnX[impactNodes[index][0]], y: impactNodes[index][1] })
  return (
    <div className="home-bento-visual home-impact">
      <div className="home-impact-stage">
        <svg aria-hidden="true" className="home-impact-wires" preserveAspectRatio="none" viewBox="0 0 100 100">
          {impactEdges.map(([from, to]) => {
            const a = point(from)
            const b = point(to)
            const middle = (a.x + b.x) / 2
            return <path className="home-impact-wire" d={`M${a.x} ${a.y} C ${middle} ${a.y}, ${middle} ${b.y}, ${b.x} ${b.y}`} key={`${from}-${to}`} style={{ animationDelay: `${impactNodes[from][0] * 0.55}s` }} />
          })}
        </svg>
        {impactNodes.map(([column, y, label, kind]) => (
          <span className={clsx('home-impact-node', `home-impact-node-${kind}`)} key={label} style={{ left: `${impactColumnX[column]}%`, top: `${y}%`, animationDelay: `${column * 0.55}s` }}>
            {label}
          </span>
        ))}
      </div>
      <div className="home-impact-legend">
        {[$('Definition'), $('Utilities'), $('Consumers'), $('Output')].map((label) => <span key={label}>{label}</span>)}
      </div>
      <code className="home-terminal-line"><span aria-hidden="true" className="fg-text-muted">$</span> {impactCommand}</code>
    </div>
  )
}

function FrameworkMarquee() {
  const frameworks = frameworkKeys.map((key) => brands[key] as { name: string, src: Logo, className?: string })
  const rows = [frameworks.slice(0, 8), frameworks.slice(8)]
  return (
    <div className="home-bento-visual home-frameworks">
      {rows.map((row, rowIndex) => (
        <div className={clsx('home-marquee', rowIndex && 'home-marquee-reverse')} key={rowIndex} style={{ '--home-marquee-duration': '28s' } as CSSProperties}>
          <div className="home-marquee-track">
            {[0, 1].map((copy) => row.map(({ name, src: Logo, className }) => (
              <span aria-hidden={copy ? 'true' : undefined} className="home-framework" key={`${copy}-${name}`}>
                <Logo aria-hidden="true" className={clsx('flex:none', className)} height={22} width={22} />
                {name}
              </span>
            )))}
          </div>
        </div>
      ))}
    </div>
  )
}

function WorkspaceTree() {
  const $ = useTranslation()
  const rows = [
    { depth: 0, name: 'apps/web', folder: true },
    { depth: 1, name: 'master.css', manifest: 'web' },
    { depth: 1, name: 'Card.tsx', uses: 'web' },
    { depth: 0, name: 'apps/docs', folder: true },
    { depth: 1, name: 'master.css', manifest: 'docs' },
    { depth: 1, name: 'guide.mdx', uses: 'docs' }
  ]
  return (
    <div aria-hidden="true" className="home-bento-visual home-workspace">
      {rows.map((row) => (
        <div className={clsx('home-workspace-row', row.uses && `home-workspace-row-${row.uses}`, row.manifest && `home-workspace-manifest-${row.manifest}`)} key={`${row.depth}-${row.name}-${row.uses ?? row.manifest ?? ''}`} style={{ paddingLeft: `${0.75 + row.depth * 1.25}rem` }}>
          {row.folder ? <IconFolder size={14} stroke={1.75} /> : <IconFileText size={14} stroke={1.75} />}
          <span>{row.name}</span>
          {row.uses && <span className="home-workspace-badge">{$('uses')} apps/{row.uses}/master.css</span>}
        </div>
      ))}
    </div>
  )
}

function RouteStyles() {
  const routes = [['/', 'home.css'], ['/pricing', 'pricing.css'], ['/blog', 'blog.css']]
  return (
    <div aria-hidden="true" className="home-bento-visual home-routes">
      <span className="home-routes-shared">master.css · @theme · @mixin</span>
      {routes.map(([route, stylesheet], index) => (
        <div className="home-routes-row" key={route} style={{ animationDelay: `${index * 1.2}s` }}>
          <IconRoute size={14} stroke={1.75} />
          <code className="fg-text-strong">{route}</code>
          <span className="home-routes-arrow" />
          <code className="home-chip">{stylesheet}</code>
        </div>
      ))}
    </div>
  )
}

function PolicySurfaces() {
  const $ = useTranslation()
  const surfaces = ['ESLint', 'CLI', 'MCP']
  return (
    <div aria-hidden="true" className="home-bento-visual home-policy">
      <code className="home-chip home-policy-source">recommended</code>
      <div className="home-policy-surfaces">
        {surfaces.map((surface, index) => (
          <span className="home-policy-surface" key={surface} style={{ animationDelay: `${index * 0.6}s` }}>
            <IconCircleCheck size={14} stroke={2} />
            {surface}
          </span>
        ))}
      </div>
      <div className="home-policy-rules">
        {['sort-classes', 'no-invalid-classes', 'no-conflicting-classes', 'prefer-canonical-classes'].map((rule) => <code key={rule}>{rule}</code>)}
      </div>
    </div>
  )
}
