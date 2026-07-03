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
import { MotionHoverSurface, MotionSection } from './HomeMotion'
import { diagnosticSignals, homeSections, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type DiagnosticSignalContent, type Translate } from './home-content'

export default function AgentDiagnosticsSection({ t }: { t: Translate }) {
    return (
        <MotionSection
            homeSection={homeSections.codeDiagnostics}
            id={homeSections.codeDiagnostics}
            className="py:5xl bt:1px|solid|subtle">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="grid-cols:1 items-center gap:2xl grid-cols:12@lg">
                    <div className="grid-col-span:7@lg">
                        <DiagnosticVisual t={t} />
                    </div>

                    <div className="max-w:breakpoint-md grid-col-span:5@lg">
                        <p className={sectionLabelClassName}>{t('Code diagnostics for AI agents.')}</p>
                        <h2 className={sectionHeadingClassName}>
                            {t('Give agents the same feedback your team trusts.')}
                        </h2>
                        <p className={sectionBodyClassName}>
                            {t('Project-aware scans, class diagnostics, generated CSS inspection, and safe fix previews make AI styling changes reviewable before they land.')}
                        </p>
                        <div className="flex flex-wrap gap:sm mt:lg">
                            <Link href="/guide/ai-coding" className="btn btn-lg touch-yellow r:md outline-offset:2xs text-decoration:none bg:yellow fg:yellow-95 outline:2px|solid|yellow:focus-visible">
                                {t('Guide AI agents')}
                                <IconArrowRight className="size:4x ml:xs stroke:1.75" />
                            </Link>
                            <Link href="/guide/mcp-server" className="app-object btn btn-lg app-object-interactive r:md outline-offset:2xs outline:2px|solid|yellow:focus-visible">
                                <IconTerminal2 className="size:4x mr:xs stroke:1.75" />
                                {t('Connect MCP')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </MotionSection>
    )
}

function DiagnosticVisual({ t }: { t: Translate }) {
    return (
        <div className="rel overflow:hidden b:1px|solid|subtle r:lg surface:raised shadow:card">
            <div className="abs inset:0 opacity:.64 pointer-events:none"
                style={{
                    background: [
                        'linear-gradient(180deg, rgb(255 255 255 / .10), transparent 24%)',
                        'radial-gradient(720px circle at 18% 18%, rgb(34 197 94 / .12), transparent 56%)'
                    ].join(',')
                }} />
            <div className="rel z:1 grid-cols:1 grid-cols:12@lg">
                <div className="p:md bb:1px|solid|subtle bg:surface-base/.72 backdrop-filter:blur(18px) grid-col-span:12@lg">
                    <div className="flex items-center justify-between gap:md">
                        <div className="flex items-center gap:sm">
                            <span className="grid place-content:center size:9x r:md bg:green fg:white">
                                <IconRobot className="size:5x stroke:1.75" />
                            </span>
                            <div>
                                <p className="m:0 font:sm text:strong">{t('Agent diagnostics')}</p>
                                <p className="m:0 font:xs text:muted">{t('Project context before writes')}</p>
                            </div>
                        </div>
                        <code className="hidden px:xs py:2xs r:sm font:xs bg:surface-muted text:strong block@md">mastercss_lint_project</code>
                    </div>
                </div>

                <div className="p:md grid-col-span:7@lg">
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

                    <div className="mt:md p:sm b:1px|solid|subtle r:md bg:surface-muted">
                        <div className="flex items-center gap:xs">
                            <IconShieldCheck className="size:4x text:green stroke:1.75" />
                            <p className="m:0 font:sm text:strong">{t('Safe preview ready')}</p>
                        </div>
                        <p className="mx:0 mb:0 mt:xs font:xs leading:md text:muted">
                            {t('Review the diff before applying any class-list fix.')}
                        </p>
                    </div>
                </div>

                <div className="grid gap:sm p:md bg:surface-muted/.24 grid-col-span:5@lg bl:1px|solid|subtle@lg">
                    {diagnosticSignals.map((signal) => (
                        <DiagnosticSignal key={signal.title} signal={signal} t={t} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function DiagnosticSignal({ signal, t }: { signal: DiagnosticSignalContent; t: Translate }) {
    const Icon = signal.status === 'context' ? IconZoomScan : signal.status === 'lint' ? IconCodeDots : IconShieldCheck

    return (
        <MotionHoverSurface className="p:sm b:1px|solid|subtle r:md surface:raised shadow:xs">
            <div className="flex items-start gap:sm">
                <span className={clsx('grid flex:0|0|auto place-content:center size:8x r:sm fg:white', signal.accent)}>
                    <Icon className="size:4x stroke:1.75" />
                </span>
                <div className="min-w:0">
                    <div className="flex items-center gap:xs">
                        <h3 className="m:0 font-weight:560 font:sm text:strong">{t(signal.title)}</h3>
                        <code className="px:2xs py:1px r:xs font:2xs bg:surface-muted text:muted">{t(signal.status)}</code>
                    </div>
                    <p className="mx:0 mb:0 mt:xs font:xs leading:1.55 text:muted">{t(signal.body)}</p>
                </div>
            </div>
        </MotionHoverSurface>
    )
}
