import brands from '~/site/docs-shell/data/brands'
import DocumentChoices from './DocumentChoices'
import { migrationGuides } from '../utils/migration-guides'

export default function MigrationGuides() {
  return <DocumentChoices label="Migration guides" entries={migrationGuides.map(guide => {
    const Icon = brands[guide.brand].src
    return { ...guide, href: `/guide/migration/${guide.slug}`, icon: <Icon width={28} height={28} /> }
  })} />
}
