import '~/site/styles/system/specimens.css'
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
 * Light and dark artwork sits on a sheet in that mode; transparent artwork on a checkerboard.
 */
export default function DemoAsset({ title, description, src, alt, width, height, format = 'SVG', surface = 'transparent' }: DemoAssetProps) {
  const image = <DemoMedia src={src} alt={alt} width={width} height={height} className="block h-auto w-auto max-w-full (max-height:6rem)" />
  return <Demo title={title} description={description} padding="sm" background={surface === 'transparent' ? 'checkerboard' : 'plain'} data-asset={surface} caption={
    <span className="flex flex-wrap items-center justify-between gap-sm">
      <span className="ui-badge" data-size="sm">{format}</span>
      <a href={src} download className="ui-button" data-size="sm" aria-label={`Download ${title} (${format})`}>
        <IconDownload aria-hidden="true" />
        Download {format}
      </a>
    </span>
  }>
    {surface === 'transparent'
      ? <div className="grid (place-items:center) w-full (min-height:9rem)">{image}</div>
      : <div className={`ui-sheet ${surface} grid (place-items:center) (min-height:9rem) w-full p-lg`} data-elevation="1">{image}</div>}
  </Demo>
}
