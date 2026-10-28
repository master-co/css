import './workflow.css'
import type { ComponentType, CSSProperties, SVGProps } from 'react'
import { IconArrowRight, IconFileText, IconFolder, IconRoute } from '@tabler/icons-react'
import clsx from 'clsx'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import brands from '~/site/docs-shell/data/brands'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import { homeSections, impactCommand, workflowCards } from './home-content'

type Logo = ComponentType<SVGProps<SVGSVGElement>>

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

// Outer columns sit far enough in for their widest label at the narrowest card.
const impactColumnX = [17, 40, 63, 87]

/** A node's trace: itself, everything it depends on and everything that depends on it. */
function traceOf(node: number) {
  const walk = (start: number, next: (edge: readonly [number, number]) => number | undefined) => {
    const seen = new Set([start])
    for (const index of seen) {
      for (const edge of impactEdges) {
        const found = edge[0] === index || edge[1] === index ? next(edge) : undefined
        if (found !== undefined && found !== index) seen.add(found)
      }
    }
    return seen
  }
  return new Set([...walk(node, (edge) => edge[1]), ...walk(node, (edge) => edge[0])])
}

/** For each node and edge, the hovered nodes whose trace includes it, as a `data-trace` word list. */
const impactNodeTraces = impactNodes.map((_, node) => impactNodes.map((__, other) => other).filter((other) => traceOf(other).has(node)).join(' '))
const impactEdgeTraces = impactEdges.map(([from, to]) => impactNodes.map((_, other) => other).filter((other) => {
  const trace = traceOf(other)
  return trace.has(from) && trace.has(to)
}).join(' '))

export default function WorkflowSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.developmentWorkflow} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          index="07"
          label={$('Workflow')}
          title={$('Works with your framework and build.')}
          body={$('The same manifest and rendering modes in every integration, from a single app to a monorepo, with a report of what each change touches.')}>
          <Link className="home-section-link" href="/guide/installation">
            {$('Install for your framework')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        <HomeBentoFrame>
          <HomeBentoGrid className="grid-cols(1) grid-cols(2)@md grid-cols(12)@lg">
            <HomeBentoCard className="grid-col-span(2)@md grid-col-span(7)@lg home-reveal-item" title={$(workflowCards.frameworks.title)} body={$(workflowCards.frameworks.body)}>
              <FrameworkMarquee />
            </HomeBentoCard>
            <HomeBentoCard className="grid-col-span(2)@md grid-col-span(5)@lg home-reveal-item" title={$(workflowCards.impact.title)} body={$(workflowCards.impact.body)}>
              <ImpactGraph />
            </HomeBentoCard>
            <HomeBentoCard className="grid-col-span(5)@lg home-reveal-item" title={$(workflowCards.workspaces.title)} body={$(workflowCards.workspaces.body)}>
              <WorkspaceTree />
            </HomeBentoCard>
            <HomeBentoCard className="grid-col-span(7)@lg home-reveal-item" title={$(workflowCards.routes.title)} body={$(workflowCards.routes.body)}>
              <RouteStyles />
            </HomeBentoCard>
          </HomeBentoGrid>
        </HomeBentoFrame>
      </div>
    </section>
  )
}

function ImpactGraph() {
  const $ = useTranslation()
  const point = (index: number) => ({ x: impactColumnX[impactNodes[index][0]], y: impactNodes[index][1] })
  return (
    <div className="home-bento-visual home-impact">
      <p aria-hidden="true" className="home-annotation home-impact-hint">{$('Point at a node to trace it')}</p>
      <div className="home-impact-stage">
        <svg aria-hidden="true" className="home-impact-wires" preserveAspectRatio="none" viewBox="0 0 100 100">
          {impactEdges.map(([from, to], index) => {
            const a = point(from)
            const b = point(to)
            const middle = (a.x + b.x) / 2
            return <path className="home-impact-wire" d={`M${a.x} ${a.y} C ${middle} ${a.y}, ${middle} ${b.y}, ${b.x} ${b.y}`} data-trace={impactEdgeTraces[index]} key={`${from}-${to}`} style={{ animationDelay: `${impactNodes[from][0] * 0.55}s` }} />
          })}
        </svg>
        {impactNodes.map(([column, y, label, kind], index) => (
          <span className={clsx('home-impact-node', `home-impact-node-${kind}`)} data-node={index} data-trace={impactNodeTraces[index]} key={label} style={{ left: `${impactColumnX[column]}%`, top: `${y}%`, animationDelay: `${column * 0.55}s` }}>
            {label}
          </span>
        ))}
      </div>
      <div className="home-impact-legend">
        {[$('Definition'), $('Utilities'), $('Consumers'), $('Output')].map((label, index) => <span key={label} style={{ left: `${impactColumnX[index]}%` }}>{label}</span>)}
      </div>
      <code className="home-terminal-line"><span aria-hidden="true" className="fg-text-muted">$</span> {impactCommand}</code>
    </div>
  )
}

function FrameworkMarquee() {
  const frameworks = frameworkKeys.map((key) => brands[key] as { name: string, src: Logo, className?: string })
  const rows = [frameworks.slice(0, 6), frameworks.slice(6, 11), frameworks.slice(11)]
  return (
    <div className="home-bento-visual home-frameworks">
      {rows.map((row, rowIndex) => (
        <div className={clsx('home-marquee', rowIndex % 2 && 'home-marquee-reverse')} key={rowIndex} style={{ '--home-marquee-duration': `${30 + rowIndex * 4}s` } as CSSProperties}>
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
