import { IconDownload } from '@tabler/icons-react'
import Demo from './Demo'
import { DemoMedia } from './primitives'

export interface DemoAssetProps {
  title: string
  description: string
  src: string
  alt: string
  width: number
  height: number
  format?: string
  surface?: 'light' | 'dark' | 'transparent'
}

/** A downloadable specimen, not a CSS test subject. Intrinsic dimensions reserve
 * the image ratio; only the preview is constrained. The file stays unchanged.
 */
export default function DemoAsset({ title, description, src, alt, width, height, format = 'SVG', surface = 'transparent' }: DemoAssetProps) {
  return <Demo title={title} description={description} padding="none" background={surface === 'transparent' ? 'checkerboard' : 'plain'} frameClassName="demo-asset" caption={
    <div className="demo-asset-footer">
      <span className="demo-asset-format">{format}</span>
      <a href={src} download aria-label={`Download ${title} (${format})`}>
        <IconDownload size={15} stroke={1.5} aria-hidden="true" />
        Download {format}
      </a>
    </div>
  }>
    <div className="demo-asset-preview" data-surface={surface}>
      <DemoMedia src={src} alt={alt} width={width} height={height} />
    </div>
  </Demo>
}
