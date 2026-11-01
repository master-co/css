import metadata from './metadata'
import ComponentDocumentation from './content.mdx'
import ComponentPage from '../../components/ComponentPage'
import IndexReviewScene from './IndexReviewScene'
import GuideIndex from '~/site/content/guide/components/GuideIndex'
import categories from '~/site/.categories/guide.json'

export { metadata }

export default function Page() {
  return <ComponentPage kicker="Documents" title="Documentation index" description="Grouped links with a useful start: the Guide and Reference indexes share one component." sections={[
    { id: 'index', title: 'Grouped entries', children: <IndexReviewScene prefix="current" /> },
    { id: 'guide', title: 'In the Guide', children: <GuideIndex pageCategories={categories.filter(category => category.name === 'Getting Started')} /> },
  ]} usage={{ href: '/guide', label: 'the Guide index' }} Documentation={ComponentDocumentation} />
}
