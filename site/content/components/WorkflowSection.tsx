import './workflow.css'
import type { ReactNode } from 'react'
import { IconArrowRight } from '@tabler/icons-react'
import clsx from 'clsx'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import type { HomeIllustrationId } from './HomeIllustration'
import { homeSections, workflowCards } from './home-content'
import { workflowGuides } from './workflow-content'
import { WorkflowTours } from './WorkflowFigures'
import WorkflowRepo from './WorkflowRepo'
import WorkflowRoutes from './WorkflowRoutes'
import WorkflowStage from './WorkflowStage'
import WorkflowTrace from './WorkflowTrace'

type WorkflowCardKey = keyof typeof workflowGuides

const cardIcons = {
  frameworks: 'workflow-integrations',
  workspaces: 'workflow-monorepo',
  routes: 'workflow-route-styles',
  impact: 'workflow-trace-change'
} satisfies Record<WorkflowCardKey, HomeIllustrationId>

/** Shared bento header with its guide linked directly from the title. */
function WorkflowCard({ card, children, className }: { card: WorkflowCardKey, children: ReactNode, className?: string }) {
  const $ = useTranslation()
  const title = $(workflowCards[card].title)
  return (
    <HomeBentoCard
      body={$(workflowCards[card].body)}
      className={clsx('home-reveal-item', className)}
      href={workflowGuides[card]}
      icon={cardIcons[card]}
      title={title}>
      {children}
    </HomeBentoCard>
  )
}

/**
 * Workflow: one project manifest, orchestrated across the frameworks, monorepo apps and routes
 * that use it, and a report of where a change goes. Each card holds one drawing straight on the
 * card: scopes are plates in one oblique projection, and a change is a gold signal from the manifest.
 */
export default function WorkflowSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.developmentWorkflow} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          icon="section-workflow"
          index="07"
          label={$('Workflow')}
          title={$('Works with your framework and build.')}
          body={$('One project manifest drives the CSS of every integration, monorepo app and route, and a snapshot comparison shows what a change touches.')}>
          <Link className="home-section-link" href="/guide/installation">
            {$('Install for your framework')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        <HomeBentoFrame>
          <HomeBentoGrid className="grid-cols(1) grid-cols(2)@md grid-cols(12)@lg home-wf-grid">
            <WorkflowCard card="frameworks" className="grid-col-span(2)@md grid-col-span(7)@lg">
              <WorkflowStage />
            </WorkflowCard>
            <WorkflowCard card="workspaces" className="grid-col-span(5)@lg">
              <WorkflowRepo />
            </WorkflowCard>
            <WorkflowCard card="routes" className="grid-col-span(5)@lg">
              <WorkflowRoutes />
            </WorkflowCard>
            <WorkflowCard card="impact" className="grid-col-span(2)@md grid-col-span(7)@lg">
              <WorkflowTrace />
            </WorkflowCard>
          </HomeBentoGrid>
        </HomeBentoFrame>
        <WorkflowTours sectionId={homeSections.developmentWorkflow} />
      </div>
    </section>
  )
}
