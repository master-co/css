import './agent.css'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import AgentSession from './AgentSession'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import HomeCodeWindow from './HomeCodeWindow'
import { agentDiagnosticCards, agentSession, homeSections } from './home-content'

export default function AgentDiagnosticsSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.codeDiagnostics} className="home-section home-section-reveal">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          index="04"
          label={$('Check')}
          title={$('Lint rules your team and agents share.')}
          body={$('ESLint, the CLI and the MCP server run the same rules, so agents catch problems in their own changes and hand you fixes as diffs.')} />
        <HomeBentoFrame>
          <HomeBentoGrid>
            <HomeBentoCard className="home-reveal-item" title={$('Check before applying fixes')} body={$('Agents lint what they wrote, preview fixes as a diff, and apply them only if the files are unchanged.')}>
              <div className="home-bento-visual">
                <AgentSession code={agentSession.code} file={agentSession.file} fixedCode={agentSession.fixedCode} problems={agentSession.problems} />
              </div>
            </HomeBentoCard>
            <HomeBentoGrid className="grid-cols(1) grid-cols(2)@md">
              {agentDiagnosticCards.map((card) => (
                <HomeBentoCard className="home-reveal-item" key={card.title} title={$(card.title)} body={$(card.body)}>
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
          </HomeBentoGrid>
        </HomeBentoFrame>
      </div>
    </section>
  )
}
