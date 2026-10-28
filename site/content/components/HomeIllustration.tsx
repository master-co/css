import { homeIconArtwork } from '~/site/assets/images/home/icons/artwork'
import '~/site/assets/images/home/icons/artwork.css'
import Image from '~/site/docs-shell/components/Image'

export type HomeIllustrationId = keyof typeof homeIconArtwork

/** Decorative, theme-specific artwork. CSS reserves its square before the image loads. */
export default function HomeIllustration({ icon, size = 80 }: { icon: HomeIllustrationId, size?: number }) {
  const artwork = homeIconArtwork[icon]
  return <span aria-hidden="true" className="home-illustration" data-home-icon={icon}>
    <Image alt="" className="home-icon-artwork home-illustration-light" height={size} src={artwork.light} width={size} />
    <Image alt="" className="home-icon-artwork home-illustration-dark" height={size} src={artwork.dark} width={size} />
  </span>
}
