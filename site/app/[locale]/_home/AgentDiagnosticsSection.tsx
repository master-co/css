import clsx from 'clsx'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, homeBentoCardBodyClassName, homeBentoCardHeaderClassName, homeBentoCardTitleClassName, homeBentoDotGridStyle, homeBentoVisualClassName } from './HomeBento'
import HomeCodeWindow, { type HomeCodeWindowProblem } from './HomeCodeWindow'
import { MotionSection } from './HomeMotion'
import { agentDiagnosticCards, homeSections, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type AgentDiagnosticCardContent, type Translate } from './home-content'

const invalidClassesCode = `
<!-- @ERROR font: -->
<button class="inline-flex px:md font: bg:blue-60">
  Save changes
</button>
`

export default function AgentDiagnosticsSection({ t }: { t: Translate }) {
    return (
        <MotionSection
            homeSection={homeSections.codeDiagnostics}
            id={homeSections.codeDiagnostics}
            className="py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="max-w:breakpoint-md">
                    <p className={sectionLabelClassName}>{t('Code diagnostics')}</p>
                    <h2 className={sectionHeadingClassName}>
                        {t('Give agents the same feedback your team trusts.')}
                    </h2>
                    <p className={sectionBodyClassName}>
                        {t('Project-aware scans, class diagnostics, generated CSS inspection, and safe fix previews make AI styling changes reviewable before they land.')}
                    </p>
                </div>

                <DiagnosticVisual t={t} />
            </div>
        </MotionSection>
    )
}

function DiagnosticVisual({ t }: { t: Translate }) {
    return (
        <HomeBentoFrame>
            <HomeBentoGrid className="grid-cols:1 grid-cols:2@md">
                {agentDiagnosticCards.map((card) => (
                    <DiagnosticCard card={card} key={card.title} t={t} />
                ))}
            </HomeBentoGrid>
        </HomeBentoFrame>
    )
}

function DiagnosticCard({ card, t }: { card: AgentDiagnosticCardContent; t: Translate }) {
    return (
        <HomeBentoCard>
            <div className={homeBentoCardHeaderClassName}>
                <h3 className={homeBentoCardTitleClassName}>
                    {t(card.title)}
                </h3>
                <p className={homeBentoCardBodyClassName}>{t(card.body)}</p>
            </div>

            {card.visual === 'invalid-classes' ? (
                <InvalidClassesCodeWindow t={t} />
            ) : (
                <DiagnosticPlaceholderCanvas />
            )}
        </HomeBentoCard>
    )
}

function InvalidClassesCodeWindow({ t }: { t: Translate }) {
    const problems: HomeCodeWindowProblem[] = [{
        code: 'invalid-class',
        location: 'home.html:1:31',
        message: t('Invalid value for `font` property.'),
        severity: 'error',
        source: '@master/css/no-invalid-classes'
    }]

    return (
        <HomeCodeWindow
            className={clsx(homeBentoVisualClassName)}
            lang="html"
            problems={problems}
            problemsLabel={t('Problems')}
            variant="embedded">
            {invalidClassesCode}
        </HomeCodeWindow>
    )
}

function DiagnosticPlaceholderCanvas() {
    return (
        <div className={clsx(homeBentoVisualClassName, 'h:32x')}>
            <div aria-hidden="true" className="abs inset:0 opacity:.8 pointer-events:none" style={homeBentoDotGridStyle} />
        </div>
    )
}
