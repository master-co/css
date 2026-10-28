import createPage from '~/site/docs-shell/factories/create-page'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import metadata from './metadata'
import * as content from './content.mdx'

export const { Page, generateMetadata } = createPage({ metadata, dictionaries, content, Layout, categoryLink: '/design-system' })
export default Page
