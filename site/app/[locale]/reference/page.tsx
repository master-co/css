import createPage from '~/site/docs-shell/factories/create-page'
import Layout from '~/site/layouts/doc'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/reference.json'
import catalog from '~/site/.generated/reference.json'
import ReferenceIndex from '~/site/reference/Index'
import type { ReferenceCatalog } from '~/site/reference/types'

export const { Page, dynamic, revalidate, generateMetadata } = createPage({
  metadata,
  dictionaries,
  categories,
  noTOC: true,
  content: () => <ReferenceIndex categoryOrder={categories.map(category => category.name)} documents={(catalog as ReferenceCatalog).documents.map(({ id, kind, title, description, category, url }) => ({ id, kind, title, description, category, url }))} />,
  Layout,
})

export default Page
