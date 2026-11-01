import '~/site/styles/demo.css'
import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export type DemoBackground = 'plain' | 'grid' | 'dots' | 'hatch' | 'checkerboard'
export type DemoPadding = 'none' | 'sm' | 'lg'
export type DemoFrame = 'default' | 'none'
export type DemoAlign = 'center' | 'start'

export interface DemoProps extends HTMLAttributes<HTMLElement> {
  title?: string
  description?: ReactNode
  caption?: ReactNode
  background?: DemoBackground
  padding?: DemoPadding
  /** `none` omits the stage when the content already owns its frame: a browser, a comparison, a code window. */
  frame?: DemoFrame
  /** Placement on the stage: centered specimens by default, or from the start edge. */
  align?: DemoAlign
  controls?: ReactNode
  /** Source and generated output, placed under the stage inside the same tray. */
  source?: ReactNode
  frameClassName?: string
}

/** One example is one tray: head, stage, source, caption. className and style belong to the stage; the chrome never joins the demonstrated layout. */
export default function Demo({
  title, description, caption, background = 'plain', padding = 'lg', frame = 'default', align = 'center', controls, source,
  frameClassName, className, style, children, ...props
}: DemoProps) {
  const head = Boolean(title || description || controls)
  return (
    <figure {...props} className={clsx('ui-tray', frameClassName)}>
      {head && (
        <figcaption className="ui-tray-head">
          {(title || description) && <div>
            {title && <p className="ui-tray-title">{title}</p>}
            {description && <p className="ui-tray-description">{description}</p>}
          </div>}
          {controls && <div className="ui-tray-tools">{controls}</div>}
        </figcaption>
      )}
      {frame === 'none'
        ? children
        : <div className={clsx('ui-stage', className)} style={style}
          data-background={background === 'plain' ? undefined : background}
          data-padding={padding === 'lg' ? undefined : padding}
          data-align={align === 'center' ? undefined : align}>
          {children}
        </div>}
      {source}
      {caption && (head ? <div className="ui-tray-caption">{caption}</div> : <figcaption className="ui-tray-caption">{caption}</figcaption>)}
    </figure>
  )
}

/** The complete generated stylesheet stays one native, closed disclosure under the source. */
export function DemoGeneratedCSS({ children }: { children: ReactNode }) {
  return <details className="ui-disclosure" suppressHydrationWarning><summary>Generated CSS</summary>{children}</details>
}
