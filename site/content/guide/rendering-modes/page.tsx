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
  subtitle: 'Choose when CSS is generated and how it reaches the page.',
  content,
  Layout,
})

export default Page