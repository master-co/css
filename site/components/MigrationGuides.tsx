import brands from '~/site/docs-shell/data/brands'
import DocumentChoices from './DocumentChoices'
import { migrationGuides } from '../utils/migration-guides'

export default function MigrationGuides() {
  return <DocumentChoices label="Migration guides" entries={migrationGuides.map(guide => {
    const { src: Icon, className } = brands[guide.brand]
    return { ...guide, href: `/guide/migration/${guide.slug}`, icon: <Icon className={className} width={20} height={20} aria-hidden="true" /> }
  })} />
}
