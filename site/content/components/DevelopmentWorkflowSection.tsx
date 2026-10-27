import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import { developmentWorkflowCards, homeSections } from './home-content'

export default function DevelopmentWorkflowSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.developmentWorkflow} className="home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          label={$('Development workflow')}
          title={$('First-class development workflow.')}
          body={$('Workspace manifests, build integrations, route boundaries, and project policy travel together from local editing to production CSS.')} />
        <HomeBentoFrame>
          <HomeBentoGrid className="grid-cols(1) grid-cols(2)@md grid-cols(4)@xl">
            {developmentWorkflowCards.map((card) => (
              <HomeBentoCard className="home-workflow-card" key={card.title} signal={$(card.signal)} title={$(card.title)} body={$(card.body)} />
            ))}
          </HomeBentoGrid>
        </HomeBentoFrame>
      </div>
    </section>
  )
}
