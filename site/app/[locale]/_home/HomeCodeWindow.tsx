import clsx from 'clsx'
import Code, { type CodeProp } from '~/internal/components/Code'

const mutedWindowDots = ['dot-1', 'dot-2', 'dot-3'] as const

export type HomeCodeWindowProblemSeverity = 'error' | 'warning'

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
    lang,
    preClassName,
    problems,
    problemsLabel = 'Problems',
    variant = 'framed'
}: HomeCodeWindowProps) {
    return (
        <div
            className={clsx(
                'rel flex overflow:hidden flex-col',
                variant === 'framed' && 'r:3xl outline:1px|solid|subtle surface:raised shadow:lg',
                className
            )}>
            <div aria-hidden="true" className="flex items-center gap:2xs px:md py:sm bb:1px|solid|subtle bg:surface-base/.72 backdrop-filter:blur(18px)">
                {mutedWindowDots.map((dot) => (
                    <span className="block size:2.5x r:full bg:line-base opacity:.56" key={dot} />
                ))}
            </div>
            <Code
                className={clsx('flex:1|1|auto min-h:0', codeClassName)}
                lang={lang}
                preClassName={clsx('overflow:hidden p:sm r:xl', preClassName)}>
                {children}
            </Code>
            {problems?.length ? (
                <div className="flex:0|0|auto bt:1px|solid|subtle bg:surface-base">
                    <div className="flex items-center justify-between gap:sm px:sm py:xs">
                        <p className="m:0 font:xs tracking:widest uppercase text:muted">{problemsLabel}</p>
                        <span className="min-w:5x px:2xs py:1px r:full font:2xs bg:red/.12 text:strong text:center">
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
    const isError = problem.severity === 'error'

    return (
        <div className="flex items-start gap:xs px:sm py:xs bt:1px|solid|subtle">
            <span
                aria-hidden="true"
                className={clsx(
                    'block size:2x mt:3xs r:full',
                    isError ? 'bg:red' : 'bg:yellow'
                )} />
            <div className="min-w:0">
                <p className="overflow:hidden m:0 font:xs text-ellipsis white-space:nowrap text:strong">
                    {problem.message}
                </p>
                <p className="overflow:hidden mx:0 mb:0 mt:1px font:2xs text-ellipsis white-space:nowrap text:muted">
                    {[problem.source, problem.code, problem.location].filter(Boolean).join(' - ')}
                </p>
            </div>
        </div>
    )
}
