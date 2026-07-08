import {
    IconArrowRight,
    IconCodeDots,
    IconRobot,
    IconShieldCheck,
    IconTerminal2,
    IconZoomScan
} from '@tabler/icons-react'
import clsx from 'clsx'
import Link from '~/internal/components/Link'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, homeBentoCardBodyClassName, homeBentoCardHeaderClassName, homeBentoCardTitleClassName, homeBentoVisualClassName } from './HomeBento'
import { MotionSection } from './HomeMotion'
import { diagnosticSignals, homeSections, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type DiagnosticSignalContent, type Translate } from './home-content'

export default function AgentDiagnosticsSection({ t }: { t: Translate }) {
    return (
        <MotionSection
            homeSection={homeSections.codeDiagnostics}
            id={homeSections.codeDiagnostics}
            className="py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="max-w:breakpoint-md">
                    <p className={sectionLabelClassName}>{t('Code diagnostics for AI agents.')}</p>
                    <h2 className={sectionHeadingClassName}>
                        {t('Give agents the same feedback your team trusts.')}
                    </h2>
                    <p className={sectionBodyClassName}>
                        {t('Project-aware scans, class diagnostics, generated CSS inspection, and safe fix previews make AI styling changes reviewable before they land.')}
                    </p>
                    <div className="flex flex-wrap gap:sm mt:lg">
                        <Link href="/guide/ai-coding" className="btn btn-lg touch-yellow r:xl outline-offset:2xs text-decoration:none bg:yellow fg:yellow-95 outline:2px|solid|yellow:focus-visible">
                            {t('Guide AI agents')}
                            <IconArrowRight className="size:4x ml:xs stroke:1.75" />
                        </Link>
                        <Link href="/guide/mcp-server" className="app-object btn btn-lg app-object-interactive r:xl outline-offset:2xs outline:2px|solid|yellow:focus-visible">
                            <IconTerminal2 className="size:4x mr:xs stroke:1.75" />
                            {t('Connect MCP')}
                        </Link>
                    </div>
                </div>

                <DiagnosticVisual t={t} />
            </div>
        </MotionSection>
    )
}

function DiagnosticVisual({ t }: { t: Translate }) {
    return (
        <HomeBentoFrame>
            <HomeBentoGrid className="grid-cols:1 grid-cols:12@lg">
                <DiagnosticCodeCard t={t} />
                <HomeBentoGrid className="grid-col-span:5@lg">
                    {diagnosticSignals.map((signal) => (
                        <DiagnosticSignalCard key={signal.title} signal={signal} t={t} />
                    ))}
                </HomeBentoGrid>
            </HomeBentoGrid>
        </HomeBentoFrame>
    )
}

function DiagnosticCodeCard({ t }: { t: Translate }) {
    return (
        <HomeBentoCard className="grid-col-span:7@lg">
            <div className={homeBentoCardHeaderClassName}>
                <div className="flex items-start justify-between gap:md">
                    <div className="flex items-start gap:sm min-w:0">
                        <span className="grid flex:0|0|auto place-content:center size:10x r:xl bg:green fg:white">
                            <IconRobot className="size:5x stroke:1.75" />
                        </span>
                        <div className="min-w:0">
                            <h3 className={homeBentoCardTitleClassName}>
                                {t('Agent diagnostics')}
                            </h3>
                            <p className={homeBentoCardBodyClassName}>{t('Project context before writes')}</p>
                        </div>
                    </div>
                    <code className="hidden flex:0|0|auto px:xs py:2xs r:lg font:xs bg:surface-muted text:strong block@md">mastercss_lint_project</code>
                </div>
            </div>

            <div className={clsx(homeBentoVisualClassName, 'p:md')}>
                <div className="grid gap:xs font:xs">
                    {[
                        ['1', '<button class="grid gap:md p:lg bg:yelow">'],
                        ['2', '  Save changes'],
                        ['3', '</button>']
                    ].map(([line, code], index) => (
                        <div className="flex items-center gap:sm" key={line}>
                            <span className="w:3x tabular-nums text:muted text:right">{line}</span>
                            <code className={clsx('overflow:hidden flex:1 min-w:0 text-ellipsis white-space:nowrap text:strong', index === 0 && 'text-decoration:underline|yellow|wavy|1px')}>
                                {code}
                            </code>
                        </div>
                    ))}
                </div>

                <div className="mt:md p:sm r:xl outline:1px|solid|subtle bg:surface-base">
                    <div className="flex items-center gap:xs">
                        <IconShieldCheck className="size:4x text:green stroke:1.75" />
                        <p className="m:0 font:sm text:strong">{t('Safe preview ready')}</p>
                    </div>
                    <p className="mx:0 mb:0 mt:xs font:xs leading:md text:muted">
                        {t('Review the diff before applying any class-list fix.')}
                    </p>
                </div>
            </div>
        </HomeBentoCard>
    )
}

function DiagnosticSignalCard({ signal, t }: { signal: DiagnosticSignalContent; t: Translate }) {
    const Icon = signal.status === 'context' ? IconZoomScan : signal.status === 'lint' ? IconCodeDots : IconShieldCheck

    return (
        <HomeBentoCard>
            <div className={clsx(homeBentoCardHeaderClassName, 'p:xl')}>
                <div className="flex items-start gap:sm">
                    <span className={clsx('grid flex:0|0|auto place-content:center size:9x r:lg fg:white', signal.accent)}>
                        <Icon className="size:4x stroke:1.75" />
                    </span>
                    <div className="min-w:0">
                        <div className="flex flex-wrap items-center gap:xs">
                            <h3 className="m:0 font-weight:560 font:lg text:strong">{t(signal.title)}</h3>
                            <code className="px:2xs py:1px r:md font:2xs bg:surface-muted text:muted">{t(signal.status)}</code>
                        </div>
                        <p className="mx:0 mb:0 mt:xs font:xs leading:1.55 text:muted">{t(signal.body)}</p>
                    </div>
                </div>
            </div>
        </HomeBentoCard>
    )
}
