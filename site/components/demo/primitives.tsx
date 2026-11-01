import '~/site/styles/system/specimens.css'
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, SVGAttributes } from 'react'
import Image, { type ImageProps as BaseImageProps } from '~/site/docs-shell/components/Image'
import clsx from 'clsx'

/** Teaching tones: neutral context, blue subject, violet comparison, amber measured, green and red outcomes. Name each one with a legend or label. */
export type DemoTone = 'neutral' | 'blue' | 'violet' | 'amber' | 'green' | 'red'
type DivProps = HTMLAttributes<HTMLDivElement>
const tone = (value: DemoTone) => value === 'neutral' ? undefined : value

/** A sheet on the stage. Geometry and padding stay with the example. */
export function DemoSurface({ elevation = 'flat', className, ...props }: DivProps & {
  elevation?: 'flat' | 'raised'
}) {
  return <div {...props} data-elevation={elevation === 'flat' ? 'flat' : '1'} className={clsx('ui-sheet', className)} />
}

/** A tile that stands for content. Utilities on the item set its size and layout. */
export function DemoItem({ tone: value = 'neutral', variant = 'soft', className, ...props }: DivProps & {
  tone?: DemoTone
  variant?: 'soft' | 'solid' | 'outline' | 'ghost'
}) {
  return <div {...props} data-tone={tone(value)} data-variant={variant === 'soft' ? undefined : variant} className={clsx('ui-item', className)} />
}

/** An inline category or state; keep it outside measured layouts. */
export function DemoBadge({ tone: value = 'neutral', size = 'md', variant = 'soft', className, ...props }: HTMLAttributes<HTMLSpanElement> & {
  tone?: DemoTone
  size?: 'sm' | 'md'
  variant?: 'soft' | 'dot'
}) {
  return <span {...props} data-tone={tone(value)} data-size={size === 'md' ? undefined : size} data-variant={variant === 'soft' ? undefined : variant} className={clsx('ui-badge', className)} />
}

/** The same subject under named conditions: each child is a captioned stage. */
export function DemoComparison({ items, className, ...props }: DivProps & {
  items: { label: ReactNode, children: ReactNode, key?: string }[]
}) {
  return <div {...props} className={clsx('ui-compare', className)}>
    {items.map((item, index) => <figure key={item.key ?? index}>
      <figcaption>{item.label}</figcaption>
      <div className="ui-stage">{item.children}</div>
    </figure>)}
  </div>
}

/** Names a condition outside the measured layout. Class names and values keep their case unless `upper` is set. */
export function DemoLabel({ upper = false, className, ...props }: HTMLAttributes<HTMLSpanElement> & { upper?: boolean }) {
  return <span {...props} data-case={upper ? undefined : 'as-is'} className={clsx('ui-label', className)} />
}

export function DemoLegend({ items, className, ...props }: HTMLAttributes<HTMLUListElement> & {
  items: { label: string, tone: DemoTone }[]
}) {
  return (
    <ul {...props} className={clsx('ui-legend', className)} aria-label="Legend">
      {items.map(({ label, tone: value }) => <li key={label}><i data-tone={tone(value)} aria-hidden="true" />{label}</li>)}
    </ul>
  )
}

type ImageProps = Omit<BaseImageProps, 'src' | 'alt'> & { src: string, alt: string, tone?: never }
type VectorProps = SVGAttributes<SVGSVGElement> & { src?: never, tone?: DemoTone }

/** Original artwork in a teaching tone, or a real image with its intrinsic size. */
export function DemoMedia(props: ImageProps): ReactElement
export function DemoMedia(props: VectorProps): ReactElement
export function DemoMedia(props: ImageProps | VectorProps) {
  if (props.src !== undefined) {
    const { alt, ...image } = props
    return <Image width={320} height={200} {...image} alt={alt} />
  }
  const { tone: value = 'neutral', style, ...vector } = props
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label="Sun above two mountain ridges" {...vector} style={{ color: `var(--ui-tone-${value})`, ...style } as CSSProperties}>
      <rect width="320" height="200" fill="var(--ui-surface-sheet)" />
      <path d="M0 158 92 65l96 93H0Z" fill="currentColor" opacity=".1" />
      <path d="M74 200 211 83l109 102v15H74Z" fill="currentColor" opacity=".16" />
      <circle cx="250" cy="49" r="23" fill="currentColor" opacity=".11" />
      <circle cx="250" cy="49" r="22.5" fill="none" stroke="currentColor" strokeOpacity=".5" />
      <path d="M0 158 92 65l96 93M74 200 211 83l109 102M0 175h320" fill="none" stroke="currentColor" strokeOpacity=".38" />
      <path d="M23 183h62m38-26h65m27 20h72" fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth=".75" />
      <circle cx="92" cy="65" r="2.5" fill="currentColor" />
      <circle cx="211" cy="83" r="2.5" fill="currentColor" />
      <rect width="319" height="199" x=".5" y=".5" fill="none" stroke="var(--ui-line-contour)" />
    </svg>
  )
}

/** A named role with its actual paint. className and style paint the face. */
export function DemoSwatch({ label, value, className, style, children, ...props }: DivProps & { label: string, value?: string }) {
  return (
    <figure className="ui-swatch">
      <div {...props} aria-hidden={props['aria-hidden'] ?? (children == null ? true : undefined)} className={clsx('ui-swatch-paint', className)} style={style}>{children}</div>
      <figcaption><b>{label}</b>{value && <code>{value}</code>}</figcaption>
    </figure>
  )
}

export function DemoAxes({ inline = 'Main axis', block = 'Cross axis', children, className, ...props }: DivProps & {
  inline?: ReactNode, block?: ReactNode
}) {
  return (
    <div {...props} className={clsx('ui-axes', className)}>
      <div className="ui-axes-inline"><span>{inline}</span><span className="ui-axes-rule" aria-hidden="true" /></div>
      <div className="ui-axes-block"><span>{block}</span><span className="ui-axes-rule" aria-hidden="true" /></div>
      <div className="ui-axes-content">{children}</div>
    </div>
  )
}

/** A local, keyboard-reachable scroll region. Name it with aria-label. */
export function DemoScrollArea({ className, tabIndex = 0, ...props }: DivProps) {
  return <div {...props} tabIndex={tabIndex} className={clsx('ui-scroll', className)} />
}

/** A labelled group of controls. `segmented` draws the sunken track with raised selected buttons. */
export function DemoControls({ label = 'Demo controls', variant = 'plain', className, children, ...props }: DivProps & {
  label?: string
  variant?: 'plain' | 'segmented'
}) {
  return <div {...props} role="group" aria-label={label} className={clsx(variant === 'segmented' ? 'ui-segmented' : 'flex flex-wrap items-center gap-xs', className)}>{children}</div>
}
