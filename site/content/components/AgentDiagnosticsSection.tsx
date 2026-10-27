import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import { agentDiagnosticCards, homeSections } from './home-content'

export default function AgentDiagnosticsSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.codeDiagnostics} className="home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          label={$('Code diagnostics')}
          title={$('Team-trusted diagnostics for agents.')}
          body={$('Project-aware scans, class diagnostics, generated CSS inspection, and safe fix previews make AI styling changes reviewable before they land.')} />
        <HomeBentoFrame>
          <HomeBentoGrid className="grid-cols(1) grid-cols(2)@md grid-cols(3)@lg">
            {agentDiagnosticCards.map((card) => (
              <HomeBentoCard key={card.title} title={$(card.title)} body={$(card.body)}>
                <HomeCodeWindow
                  className="home-bento-visual"
                  fixPreviewCode={card.fixPreviewCode}
                  lang="html"
                  problems={[card.problem]}
                  problemsLabel={$(card.problemsLabel)}
                  variant="embedded">
                  {card.code}
                </HomeCodeWindow>
              </HomeBentoCard>
            ))}
          </HomeBentoGrid>
        </HomeBentoFrame>
      </div>
    </section>
  )
}
