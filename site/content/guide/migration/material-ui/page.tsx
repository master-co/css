import createHeaderIcon from '~/site/docs-shell/factories/create-header-icon'
import createPage from '~/site/docs-shell/factories/create-page'
import Layout from '~/site/layouts/doc'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import * as content from './content.mdx'

export const { Page, generateMetadata } = createPage({
  metadata,
  dictionaries,
  categories,
  icon: createHeaderIcon('mui'),
  categoryLink: '/guide/migration#frameworks',
  content,
  Layout,
})

export default Page
