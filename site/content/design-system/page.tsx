import createPage from '~/site/docs-shell/factories/create-page'
import Layout from '~/site/layouts/doc'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import * as content from './content.mdx'

export const { Page, generateMetadata } = createPage({
  metadata,
  dictionaries,
  content,
  Layout,
})

export default Page