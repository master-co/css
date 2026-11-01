import '~/site/styles/integration-cover.css'
import Image, { type StaticImage } from '../docs-shell/components/Image'

interface IntegrationCoverProps {
  images: { light: StaticImage, dark: StaticImage }
  alt: string
}

/** A single accessible cover with matched light/dark artwork and intrinsic sizing. */
export default function IntegrationCover({ images, alt }: IntegrationCoverProps) {
  return <div className="integration-cover" role="img" aria-label={alt}>
    {(['light', 'dark'] as const).map(scheme => <Image
      key={scheme}
      src={images[scheme]}
      data-scheme={scheme}
      sizes="(max-width: 834px) 100vw, 720px"
      alt=""
      aria-hidden="true"
      priority
    />)}
  </div>
}
