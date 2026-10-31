import type { ReactNode } from 'react'
import Image, { type StaticImage } from '../docs-shell/components/Image'
import '../styles/documentation-illustration.css'

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
  return <figure className="doc-illustration" aria-label={title}>
    <figcaption>{title}</figcaption>
    <div className="doc-illustration-art" role="img" aria-label={alt}>
      {(['light', 'dark'] as const).map(theme => <Image
        key={theme}
        src={images[theme]}
        className={`doc-illustration-${theme}`}
        sizes="(max-width: 834px) 100vw, 900px"
        alt=""
        aria-hidden="true"
      />)}
    </div>
    <p className="doc-illustration-caption">{caption}</p>
    <details className="doc-illustration-description">
      <summary>Text description</summary>
      {children}
    </details>
  </figure>
}
