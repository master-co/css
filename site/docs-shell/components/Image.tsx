import type { CSSProperties, ImgHTMLAttributes } from 'react'
import { createCloudflareImageUrl } from '~/site/utils/cloudflare-image-loader.js'

/** Static image imports resolve to Astro image metadata. */
export interface StaticImage {
  src: string
  width: number
  height: number
}

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height' | 'placeholder'> & {
  src: string | StaticImage
  width?: number | `${number}`
  height?: number | `${number}`
  /** Cover the positioned parent, like a background image. */
  fill?: boolean
  /** Load immediately with high fetch priority. */
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
}

const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
const imageSizes = [16, 32, 48, 64, 96, 128, 256, 384]
const allSizes = [...imageSizes, ...deviceSizes]
const transformations = import.meta.env.PUBLIC_IMAGE_TRANSFORMATIONS === 'true'
const fillStyle: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' }

function candidateWidths(width: number | undefined, sizes: string | undefined) {
  if (sizes || !width) return deviceSizes
  return [...new Set([width, width * 2].map((size) => allSizes.find((candidate) => candidate >= size) ?? allSizes.at(-1)!))]
}

/** Render a bitmap with intrinsic dimensions and, on Cloudflare, resized sources. */
export default function Image({ src, width, height, fill, priority, quality, placeholder: _placeholder, loading, sizes, style, alt = '', ...props }: ImageProps) {
  const source = typeof src === 'string' ? src : src.src
  const intrinsicWidth = fill ? undefined : Number(width ?? (typeof src === 'object' ? src.width : undefined)) || undefined
  const intrinsicHeight = fill ? undefined : Number(height ?? (typeof src === 'object' ? src.height : undefined)) || undefined
  const url = (size: number) => createCloudflareImageUrl({ src: source, width: size, quality, siteUrl: import.meta.env.PUBLIC_URL })
  const widths = candidateWidths(intrinsicWidth, sizes)
  const resized = transformations && url(widths[0]) !== source
  return (
    <img
      {...props}
      alt={alt}
      src={resized ? url(widths.at(-1)!) : source}
      srcSet={resized ? widths.map((size, index) => sizes || !intrinsicWidth ? `${url(size)} ${size}w` : `${url(size)} ${index + 1}x`).join(', ') : undefined}
      sizes={resized ? sizes ?? (fill ? '100vw' : undefined) : undefined}
      width={intrinsicWidth}
      height={intrinsicHeight}
      loading={priority ? 'eager' : loading ?? 'lazy'}
      fetchPriority={priority ? 'high' : props.fetchPriority}
      decoding="async"
      style={fill ? { ...fillStyle, ...style } : style}
    />
  )
}
