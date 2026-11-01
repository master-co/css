import '~/site/styles/system/data.css'
import '~/site/styles/installation.css'
import Link from '~/site/docs-shell/components/Link'
import brands from '~/site/docs-shell/data/brands'
import { installationGuideGroups } from '../utils/installation-guides'

/** A grouped directory; framework aliases keep their existing guide anchors. */
export default function InstallationGuides() {
  return <nav aria-label="Installation guides" className="installation-guides">
    {installationGuideGroups.map(group => <div key={group.title} className="installation-guides-group">
      <p className="installation-guides-label">{group.title}</p>
      <div className="ui-logos">
        {group.entries.map(([slug, title, href]) => {
          const brand = brands[slug]
          return <Link key={slug} href={href}>
            <brand.src className={brand.className} width={20} height={20} aria-hidden="true" />
            <span>{title}</span>
          </Link>
        })}
      </div>
    </div>)}
  </nav>
}
