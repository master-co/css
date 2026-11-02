import createPage from '~/site/docs-shell/factories/create-page'
import Layout from '~/site/layouts/blog-article'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/blog.json'
import * as content from './content.mdx'

// The future launch video belongs at the start of content.mdx, below the masthead.
export const { Page, generateMetadata } = createPage({ metadata, dictionaries, categories, content, Layout })
export default Page
