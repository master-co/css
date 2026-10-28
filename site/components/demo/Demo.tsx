import '~/site/styles/demo.css'
import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export type DemoBackground = 'stripes' | 'grid' | 'dots' | 'plain' | 'checkerboard'
export type DemoPadding = 'none' | 'sm' | 'md' | 'lg'
export type DemoFrame = 'default' | 'none'

export interface DemoProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: ReactNode
  caption?: ReactNode
  background?: DemoBackground
  padding?: DemoPadding
  /** Omit the surrounding boundary when the content already owns its frame. */
  frame?: DemoFrame
  controls?: ReactNode
  frameClassName?: string
}

/** className/style belong to the canvas; the chrome never joins the demonstrated layout. */
export default function Demo({
  title, description, caption, background = 'plain', padding = 'lg', frame = 'default', controls,
  frameClassName, className, style, children, ...props
}: DemoProps) {
  return (
    <div {...props} className={clsx('site-demo', frameClassName)} data-frame={frame}>
      {(title || description || controls) && (
        <div className="demo-header">
          {(title || description) && <div>
            {title && <div className="demo-title">{title}</div>}
            {description && <div className="demo-description">{description}</div>}
          </div>}
          {controls && <div className="demo-header-controls">{controls}</div>}
        </div>
      )}
      <div className={clsx('demo-canvas', className)} data-background={background} data-padding={padding} style={style}>
        {children}
      </div>
      {caption && <div className="demo-caption">{caption}</div>}
    </div>
  )
}
