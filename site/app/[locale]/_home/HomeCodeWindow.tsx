import clsx from 'clsx'
import Code, { type CodeProp } from '~/internal/components/Code'

const mutedWindowDots = ['dot-1', 'dot-2', 'dot-3'] as const

export interface HomeCodeWindowProps {
    bodyClassName?: string
    children: string
    className?: string
    codeClassName?: string
    lang: CodeProp['lang']
    variant?: 'framed' | 'embedded'
}

export default function HomeCodeWindow({
    bodyClassName,
    children,
    className,
    codeClassName,
    lang,
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
            <div className={clsx('rel flex:1 min-h:0 p:xs p:sm@md', bodyClassName)}>
                <Code
                    className={clsx('h:full {overflow:hidden}_pre {r:xl}_pre', codeClassName)}
                    lang={lang}>
                    {children}
                </Code>
            </div>
        </div>
    )
}
