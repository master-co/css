import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid } from './HomeBento'
import { MotionSection } from './HomeMotion'
import { developmentWorkflowCards, homeSections, type DevelopmentWorkflowCardContent, type Translate } from './home-content'

export default function DevelopmentWorkflowSection({ t }: { t: Translate }) {
    return (
        <MotionSection
            homeSection={homeSections.developmentWorkflow}
            id={homeSections.developmentWorkflow}
            className="home-section">
            <div className="home-section-wrap">
                <div className="home-section-copy">
                    <p className="home-section-label">{t('Development workflow')}</p>
                    <h2 className="home-section-heading">
                        {t('First-class development workflow.')}
                    </h2>
                    <p className="home-section-body">
                        {t('Workspace manifests, build integrations, route boundaries, and project policy travel together from local editing to production CSS.')}
                    </p>
                </div>

                <HomeBentoFrame>
                    <HomeBentoGrid className="grid-cols:1 grid-cols:2@md grid-cols:4@xl">
                        {developmentWorkflowCards.map((card) => (
                            <DevelopmentWorkflowCard card={card} key={card.title} t={t} />
                        ))}
                    </HomeBentoGrid>
                </HomeBentoFrame>
            </div>
        </MotionSection>
    )
}

function DevelopmentWorkflowCard({ card, t }: { card: DevelopmentWorkflowCardContent; t: Translate }) {
    return (
        <HomeBentoCard className="home-workflow-card">
            <div className="home-bento-card-header">
                <span className="home-workflow-signal">{t(card.signal)}</span>
                <h3 className="home-bento-card-title">
                    {t(card.title)}
                </h3>
                <p className="home-bento-card-body">{t(card.body)}</p>
            </div>
        </HomeBentoCard>
    )
}
