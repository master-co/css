import '~/site/styles/system/data.css'
import type { ReactNode } from 'react'
import Translate from '~/site/docs-shell/components/Translate'

interface BenchmarkFigureProps {
  title?: ReactNode
  description?: ReactNode
  caption?: ReactNode
  children: ReactNode
  className?: string
}

/** A titled chart, its sample context and its caption as one figure. */
export default function BenchmarkFigure(props: BenchmarkFigureProps) {
  const { title, description, caption, children, className } = props

  return (
    <figure className={className ? `ui-tray ${className}` : 'ui-tray'}>
      {(title || description) && (
        <div className="ui-tray-head">
          <div>
            {title && <p className="ui-tray-title"><Translate>{title}</Translate></p>}
            {description && <p className="ui-tray-description"><Translate>{description}</Translate></p>}
          </div>
        </div>
      )}
      {children}
      {caption && <figcaption className="ui-tray-caption"><Translate>{caption}</Translate></figcaption>}
    </figure>
  )
}
