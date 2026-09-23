import type { HTMLAttributes, ReactElement, ReactNode, SVGAttributes } from 'react'
import Image, { type ImageProps as NextImageProps } from 'next/image'
import clsx from 'clsx'

export type DemoTone = 'neutral' | 'blue' | 'violet' | 'amber'
type DivProps = HTMLAttributes<HTMLDivElement>
interface ItemProps extends DivProps {
  tone?: DemoTone
  variant?: 'soft' | 'solid' | 'outline' | 'ghost'
}

export function DemoSurface({ elevation = 'none', className, ...props }: DivProps & {
  elevation?: 'none' | 'raised'
}) {
  return <div {...props} data-elevation={elevation} className={clsx('demo-surface', className)} />
}

/** Paint only: layout, dimensions, padding and positioning stay with the example. */
export function DemoItem({ tone = 'neutral', variant = 'soft', className, ...props }: ItemProps) {
  return <div {...props} data-tone={tone} data-variant={variant} className={clsx('demo-item', className)} />
}

/** An inline annotation with explicit padding; keep it outside measured layouts. */
export function DemoBadge({ tone = 'neutral', size = 'md', variant = 'soft', className, ...props }: HTMLAttributes<HTMLSpanElement> & {
  tone?: DemoTone
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: ItemProps['variant']
}) {
  return <span {...props} data-tone={tone} data-size={size} data-variant={variant} className={clsx('demo-badge demo-item', className)} />
}

export function DemoComparison({ className, ...props }: DivProps) {
  return <div {...props} className={clsx('demo-comparison', className)} />
}

export function DemoLabel({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={clsx('demo-label', className)} />
}

export function DemoLegend({ items, className, ...props }: HTMLAttributes<HTMLUListElement> & {
  items: { label: string, tone: DemoTone }[]
}) {
  return (
    <ul {...props} className={clsx('demo-legend', className)} aria-label="Legend">
      {items.map(({ label, tone }) => <li key={label}><span data-tone={tone} className="demo-legend-dot" aria-hidden="true" />{label}</li>)}
    </ul>
  )
}

export function DemoText({ variant = 'body', className, ...props }: HTMLAttributes<HTMLParagraphElement> & {
  variant?: 'body' | 'lead' | 'caption'
}) {
  return <p {...props} data-variant={variant} className={clsx('demo-text', className)} />
}

type ImageProps = Omit<NextImageProps, 'src' | 'alt'> & { src: string, alt: string }
type VectorProps = SVGAttributes<SVGSVGElement> & { src?: never }

export function DemoMedia(props: ImageProps): ReactElement
export function DemoMedia(props: VectorProps): ReactElement
export function DemoMedia(props: ImageProps | VectorProps) {
  if (props.src !== undefined) {
    const { className, alt, ...image } = props
    return <Image width={320} height={200} unoptimized {...image} alt={alt} className={clsx('demo-media', className)} />
  }
  const { className, ...vector } = props
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label="Sun above two mountain ridges" {...vector} className={clsx('demo-media', className)}>
      <rect width="320" height="200" fill="var(--color-demo-surface)" />
      <path d="M0 158 92 65l96 93H0Z" fill="currentColor" opacity=".1" />
      <path d="M74 200 211 83l109 102v15H74Z" fill="currentColor" opacity=".16" />
      <circle cx="250" cy="49" r="23" fill="currentColor" opacity=".11" />
      <circle cx="250" cy="49" r="22.5" fill="none" stroke="currentColor" strokeOpacity=".5" />
      <path d="M0 158 92 65l96 93M74 200 211 83l109 102M0 175h320" fill="none" stroke="currentColor" strokeOpacity=".38" />
      <path d="M23 183h62m38-26h65m27 20h72" fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth=".75" />
      <circle cx="92" cy="65" r="2.5" fill="currentColor" />
      <circle cx="211" cy="83" r="2.5" fill="currentColor" />
    </svg>
  )
}

export function DemoSwatch({ label, value, className, children, ...props }: DivProps & { label: string, value?: string }) {
  return (
    <div className="demo-swatch">
      <div {...props} aria-hidden={props['aria-hidden'] ?? (children == null ? true : undefined)} className={clsx('demo-swatch-color', className)}>{children}</div>
      <div className="demo-swatch-meta"><span>{label}</span>{value && <code>{value}</code>}</div>
    </div>
  )
}

export function DemoAxes({ inline = <><strong>Main</strong> axis</>, block = <><strong>Cross</strong> axis</>, children, className, ...props }: DivProps & {
  inline?: ReactNode, block?: ReactNode
}) {
  return (
    <div {...props} className={clsx('demo-axes', className)}>
      <div className="demo-axis-inline"><span>{inline}</span><span className="demo-axis-inline-rule" aria-hidden="true" /></div>
      <div className="demo-axis-block"><span>{block}</span><span className="demo-axis-block-rule" aria-hidden="true" /></div>
      <div className="demo-axis-content">{children}</div>
    </div>
  )
}

export function DemoScrollArea({ className, tabIndex = 0, ...props }: DivProps) {
  return <div {...props} tabIndex={tabIndex} className={clsx('demo-scroll-area', className)} />
}

export function DemoControls({ label = 'Demo controls', variant = 'plain', className, children, ...props }: HTMLAttributes<HTMLFieldSetElement> & {
  label?: string
  variant?: 'plain' | 'segmented'
}) {
  return <fieldset {...props} data-variant={variant} className={clsx('demo-controls', className)}><legend className="sr-only">{label}</legend>{children}</fieldset>
}

export function DemoPanel({ className, ...props }: DivProps) {
  return <DemoSurface {...props} className={clsx('w:full p:md p:lg@sm', className)} />
}

export function DemoP({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <DemoText {...props} className={clsx('font:xl text:strong', className)} />
}
