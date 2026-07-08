import createPage from '~/internal/factories/create-page'
import Layout from '~/site/layouts/doc'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'

export const { Page, dynamic, revalidate, generateMetadata } = createPage({
  metadata,
  dictionaries,
  categories,
  icon: 'v1',
  categoryLink: '/guide/migration#frameworks',
  content: import('./content.mdx'),
  Layout,
})

export default Page
