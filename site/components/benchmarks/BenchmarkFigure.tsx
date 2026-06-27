import type { ReactNode } from 'react'
import clsx from 'clsx'

interface BenchmarkFigureProps {
    title?: ReactNode
    description?: ReactNode
    caption?: ReactNode
    children: ReactNode
    className?: string
}

export default function BenchmarkFigure(props: BenchmarkFigureProps) {
    const { title, description, caption, children, className } = props

    return (
        <figure className={className}>
            {(title || description) && (
                <div className="mb:md">
                    {title && <h3 className="m:0 font-weight:460 font:lg text:strong">{title}</h3>}
                    {description && <p className="mx:0 mb:0 mt:2xs font:sm text:muted">{description}</p>}
                </div>
            )}
            {children}
            {caption && <figcaption className="mt:sm font:sm text:muted">{caption}</figcaption>}
        </figure>
    )
}
