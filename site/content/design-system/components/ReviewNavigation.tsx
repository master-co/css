import '~/site/styles/design-system.css'
import '~/site/styles/docs-shell/docs.css'
import Link from '~/site/docs-shell/components/Link'

export default function ReviewNavigation() {
  return <nav className="ds-review-navigation" aria-label="Design system navigation">
    <Link href="/design-system">← Design system</Link>
    <Link href="/design-system/authoring">Authoring handbook ↗</Link>
  </nav>
}
