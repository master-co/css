import '~/site/styles/system/data.css'
import Link from '~/site/docs-shell/components/Link'
import brands from '~/site/docs-shell/data/brands'
import { installationGuides } from '../utils/installation-guides'

/** One logo tile per integration; several share a consolidated guide. */
export default function InstallationGuides() {
  return <nav aria-label="Installation guides" className="ui-logos">
    {installationGuides.map(([slug, title, href]) => {
      const brand = brands[slug]
      return <Link key={slug} href={href}>
        <brand.src className={brand.className} width={32} height={32} aria-hidden="true" />
        <span>{title}</span>
      </Link>
    })}
  </nav>
}
