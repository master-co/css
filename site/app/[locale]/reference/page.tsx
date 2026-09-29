import createPage from '~/site/docs-shell/factories/create-page'
import Layout from '~/site/layouts/doc'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/reference.json'
import { routeIndex } from '~/site/reference/route-index'
import ReferenceIndex from '~/site/reference/Index'

export const { Page, dynamic, revalidate, generateMetadata } = createPage({
  metadata,
  dictionaries,
  categories,
  noTOC: true,
  content: () => <ReferenceIndex categoryOrder={categories.map(category => category.name)} documents={routeIndex} />,
  Layout,
})

export default Page
