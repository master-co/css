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
    preClassName,
    problems,
    problemsLabel = 'Problems',
    variant = 'framed'
}: HomeCodeWindowProps) {
    const codePreClassName = clsx('overflow:hidden px:sm py:lg r:xl', preClassName)
    const hasFixPreview = Boolean(fixPreviewCode)
    const resolvedFixPreviewCode = fixPreviewCode ?? ''

    return (
        <div
            className={clsx(
                'rel flex overflow:hidden flex-col',
                hasFixPreview && 'opacity:0:hover_.home-code-window__source opacity:1:hover_.home-code-window__fix opacity:0:active_.home-code-window__source opacity:1:active_.home-code-window__fix',
                variant === 'framed' && 'r:3xl outline:1px|solid|subtle surface:raised shadow:lg',
                className
            )}>
            <div aria-hidden="true" className="flex items-center gap:2xs px:md py:sm bb:1px|solid|subtle bg:surface-base/.72 backdrop-filter:blur(18px)">
                {mutedWindowDots.map((dot) => (
                    <span className="block size:2.5x r:full bg:line-base opacity:.56" key={dot} />
                ))}
            </div>
            {hasFixPreview ? (
                <div className={clsx('grid flex:1|1|auto min-h:0', codeClassName)}>
                    <div className="grid-area:1/1/2/2 min-w:0 transition:opacity|.2s|ease-out will-change:opacity home-code-window__source">
                        <Code lang={lang} preClassName={codePreClassName}>
                            {children}
                        </Code>
                    </div>
                    <div aria-hidden="true" className="grid-area:1/1/2/2 min-w:0 opacity:0 transition:opacity|.2s|ease-out will-change:opacity home-code-window__fix">
                        <Code lang={lang} preClassName={codePreClassName}>
                            {resolvedFixPreviewCode}
                        </Code>
                    </div>
                </div>
            ) : (
                <Code
                    className={clsx('flex:1|1|auto min-h:0', codeClassName)}
                    lang={lang}
                    preClassName={codePreClassName}>
                    {children}
                </Code>
            )}
            {problems?.length ? (
                <div className="flex:0|0|auto bt:1px|solid|subtle bg:surface-base">
                    <div className="flex items-center gap:xs px:md py:sm bb:1px|dashed|subtle">
                        <p className="m:0 font:2xs tracking:widest uppercase text:strong">{problemsLabel}</p>
                        <span className="px:xs rounded font:2xs text-center surface:muted text:strong">
                            {problems.length}
                        </span>
                    </div>
                    <div className="grid">
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
        <div className="flex items-start gap:sm p:md">
            <Icon
                aria-hidden="true"
                className={clsx(
                    'flex:0|0|auto size:4x mt:1px stroke:1.75',
                    problemIconClassNameBySeverity[problem.severity]
                )} />
            <div className="min-w:0">
                <p className="overflow:hidden m:0 font:sm text-ellipsis white-space:nowrap text:strong">
                    {problem.message}
                </p>
                <p className="overflow:hidden mx:0 mb:0 mt:2xs font:2xs text-ellipsis white-space:nowrap text:muted">
                    {[problem.source, problem.code, problem.location].filter(Boolean).join(' - ')}
                </p>
            </div>
        </div>
    )
}
