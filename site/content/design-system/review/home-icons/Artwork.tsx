import type { HomeIconDefinition } from '~/site/assets/images/home/icons/catalog'
import '~/site/assets/images/home/icons/artwork.css'
import Image from '~/site/docs-shell/components/Image'

/** Preview-only composition; homepage consumers can import each themed asset directly. */
export default function Artwork({ entry, size = 96, theme }: {
  entry: HomeIconDefinition
  size?: number
  theme?: 'light' | 'dark'
}) {
  return theme
    ? <Image src={entry.artwork[theme]} width={size} height={size} className="home-icon-artwork" alt="" aria-hidden="true" />
    : <span className="hir-artwork" style={{ width: size, height: size }} aria-hidden="true">
      <Image src={entry.artwork.light} width={size} height={size} className="hir-artwork-light home-icon-artwork" alt="" />
      <Image src={entry.artwork.dark} width={size} height={size} className="hir-artwork-dark home-icon-artwork" alt="" />
    </span>
}
