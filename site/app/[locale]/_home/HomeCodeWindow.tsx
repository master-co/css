import { IconAlertTriangle, IconCircleX, IconInfoCircle } from '@tabler/icons-react'
import type { ComponentType } from 'react'
import clsx from 'clsx'
import Code, { type CodeProp } from '~/internal/components/Code'

const mutedWindowDots = ['dot-1', 'dot-2', 'dot-3'] as const

export type HomeCodeWindowProblemSeverity = 'error' | 'info' | 'warning'

type ProblemIcon = ComponentType<{ className?: string }>

const problemIconBySeverity = {
    error: IconCircleX,
    info: IconInfoCircle,
    warning: IconAlertTriangle
} satisfies Record<HomeCodeWindowProblemSeverity, ProblemIcon>

const problemIconClassNameBySeverity = {
    error: 'text:red',
    info: 'text:blue',
    warning: 'text:amber'
} satisfies Record<HomeCodeWindowProblemSeverity, string>

export interface HomeCodeWindowProblem {
    code?: string
    location?: string
    message: string
    severity: HomeCodeWindowProblemSeverity
    source?: string
}

export interface HomeCodeWindowProps {
    children: string
    className?: string
    codeClassName?: string
    fixPreviewCode?: string
    lang: CodeProp['lang']
    masterCSS?: CodeProp['masterCSS']
    preClassName?: CodeProp['preClassName']
    problems?: readonly HomeCodeWindowProblem[]
    problemsLabel?: string
    variant?: 'framed' | 'embedded'
}

export default function HomeCodeWindow({
    children,
    className,
    codeClassName,
    fixPreviewCode,
    lang,
    masterCSS,
    preClassName,
    problems,
    problemsLabel = 'Problems',
    variant = 'framed'
}: HomeCodeWindowProps) {
    const codePreClassName = clsx('home-code-window-pre', preClassName)
    const hasFixPreview = Boolean(fixPreviewCode)
    const resolvedFixPreviewCode = fixPreviewCode ?? ''

    return (
        <div
            className={clsx(
                'home-code-window',
                hasFixPreview && 'home-code-window-has-fix',
                variant === 'framed' && 'home-code-window-framed',
                className
            )}>
            <div aria-hidden="true" className="home-code-window-chrome">
                {mutedWindowDots.map((dot) => (
                    <span className="home-code-window-dot" key={dot} />
                ))}
            </div>
            {hasFixPreview ? (
                <div className={clsx('home-code-window-stack', codeClassName)}>
                    <div className="home-code-window__source home-code-window-layer">
                        <Code lang={lang} masterCSS={masterCSS} preClassName={codePreClassName}>
                            {children}
                        </Code>
                    </div>
                    <div aria-hidden="true" className="home-code-window__fix home-code-window-layer home-code-window-layer-fix">
                        <Code lang={lang} masterCSS={masterCSS} preClassName={codePreClassName}>
                            {resolvedFixPreviewCode}
                        </Code>
                    </div>
                </div>
            ) : (
                <Code
                    className={clsx('home-code-window-body', codeClassName)}
                    lang={lang}
                    masterCSS={masterCSS}
                    preClassName={codePreClassName}>
                    {children}
                </Code>
            )}
            {problems?.length ? (
                <div className="home-code-window-problems">
                    <div className="home-code-window-problems-bar">
                        <p className="home-code-window-problems-label">{problemsLabel}</p>
                        <span className="home-code-window-problems-count">
                            {problems.length}
                        </span>
                    </div>
                    <div className="home-code-window-problems-list">
                        {problems.map((problem, index) => (
                            <ProblemRow key={`${problem.message}-${index}`} problem={problem} />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

function ProblemRow({ problem }: { problem: HomeCodeWindowProblem }) {
    const Icon = problemIconBySeverity[problem.severity]

    return (
        <div className="home-code-window-problem">
            <Icon
                aria-hidden="true"
                className={clsx(
                    'home-code-window-problem-icon',
                    problemIconClassNameBySeverity[problem.severity]
                )} />
            <div className="home-code-window-problem-content">
                <p className="home-code-window-problem-message">
                    {problem.message}
                </p>
                <p className="home-code-window-problem-meta">
                    {[problem.source, problem.code, problem.location].filter(Boolean).join(' - ')}
                </p>
            </div>
        </div>
    )
}
