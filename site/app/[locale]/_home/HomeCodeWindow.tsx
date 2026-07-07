import clsx from 'clsx'
import Code, { type CodeProp } from '~/internal/components/Code'

const mutedWindowDots = ['dot-1', 'dot-2', 'dot-3'] as const

export interface HomeCodeWindowProps {
    children: string
    className?: string
    codeClassName?: string
    lang: CodeProp['lang']
    preClassName?: CodeProp['preClassName']
    variant?: 'framed' | 'embedded'
}

export default function HomeCodeWindow({
    children,
    className,
    codeClassName,
    lang,
    preClassName,
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
        </div>
    )
}
