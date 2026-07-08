import type { ReactNode } from 'react'
import clsx from 'clsx'
import Translate from '~/internal/components/Translate'

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
          {title && <h3 className="m:0 font-weight:460 font:lg text:strong"><Translate>{title}</Translate></h3>}
          {description && <p className="mx:0 mb:0 mt:2xs font:sm text:muted"><Translate>{description}</Translate></p>}
        </div>
      )}
      {children}
      {caption && <figcaption className="mt:sm font:sm text:muted"><Translate>{caption}</Translate></figcaption>}
    </figure>
  )
}
