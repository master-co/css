import createPage from '~/site/docs-shell/factories/create-page'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import * as content from './content.mdx'

export const { Page, generateMetadata } = createPage({
  metadata,
  dictionaries,
  categories,
  categoryLink: '/guide/installation/integrations',
  content,
})

export default Page
