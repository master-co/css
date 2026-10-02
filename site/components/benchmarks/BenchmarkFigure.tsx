import type { ReactNode } from 'react'
import clsx from 'clsx'
import Translate from '~/site/docs-shell/components/Translate'

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
        <div className="mb-md">
          {title && <h3 className="margin:0 font-lg font-weight:460 fg-text-strong"><Translate>{title}</Translate></h3>}
          {description && <p className="margin-inline:0 mt-2xs margin-bottom:0 font-sm fg-text-muted"><Translate>{description}</Translate></p>}
        </div>
      )}
      {children}
      {caption && <figcaption className="mt-sm font-sm fg-text-muted"><Translate>{caption}</Translate></figcaption>}
    </figure>
  )
}
