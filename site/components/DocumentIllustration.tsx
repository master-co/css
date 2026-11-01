import '~/site/styles/documentation-illustration.css'
import type { ReactNode } from 'react'
import Image, { type StaticImage } from '../docs-shell/components/Image'

export interface IllustrationImages {
  light: StaticImage
  dark: StaticImage
}

interface DocumentIllustrationProps {
  title: string
  alt: string
  images: IllustrationImages
  caption: string
  children: ReactNode
}

/** A static figure with one accessible image and an independent text description. */
export default function DocumentIllustration({ title, alt, images, caption, children }: DocumentIllustrationProps) {
  return <figure className="ui-tray" aria-label={title}>
    <figcaption className="ui-tray-head"><p className="ui-tray-title">{title}</p></figcaption>
    <div className="document-illustration" role="img" aria-label={alt}>
      {(['light', 'dark'] as const).map(scheme => <Image
        key={scheme}
        src={images[scheme]}
        data-scheme={scheme}
        sizes="(max-width: 834px) 100vw, 900px"
        alt=""
        aria-hidden="true"
      />)}
    </div>
    <p className="ui-tray-caption">{caption}</p>
    <details className="ui-disclosure" suppressHydrationWarning>
      <summary>Text description</summary>
      <div className="ui-disclosure-body ui-tray-caption">{children}</div>
    </details>
  </figure>
}
