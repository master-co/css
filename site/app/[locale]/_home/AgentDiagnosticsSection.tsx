import clsx from 'clsx'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, homeBentoCardHeaderClassName, homeBentoDotGridStyle, homeBentoVisualClassName } from './HomeBento'
import { MotionSection } from './HomeMotion'
import { homeSections, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type Translate } from './home-content'

const agentDiagnosticPlaceholders = Array.from({ length: 6 }, (_, index) => index)

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

                <DiagnosticVisual />
            </div>
        </MotionSection>
    )
}

function DiagnosticVisual() {
    return (
        <HomeBentoFrame>
            <HomeBentoGrid className="grid-cols:1 grid-cols:2@md">
                {agentDiagnosticPlaceholders.map((placeholder) => (
                    <DiagnosticPlaceholderCard key={placeholder} />
                ))}
            </HomeBentoGrid>
        </HomeBentoFrame>
    )
}

function DiagnosticPlaceholderCard() {
    return (
        <HomeBentoCard>
            <div className={homeBentoCardHeaderClassName}>
                <div className="h:6x w:42% max-w:52x r:full bg:surface-muted" />
                <div className="grid gap:2xs mt:sm">
                    <div className="h:3x w:72% r:full bg:surface-muted" />
                    <div className="h:3x w:54% r:full bg:surface-muted" />
                </div>
            </div>

            <div className={clsx(homeBentoVisualClassName, 'h:32x')}>
                <div aria-hidden="true" className="abs inset:0 opacity:.8 pointer-events:none" style={homeBentoDotGridStyle} />
            </div>
        </HomeBentoCard>
    )
}
