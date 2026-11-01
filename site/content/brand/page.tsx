import createPage from '~/site/docs-shell/factories/create-page'
import DocLayout from '~/site/layouts/doc'
import DocWrapper from '~/site/docs-shell/components/DocWrapper'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import * as content from './content.mdx'

/** A standalone identity guide: the document column without the Guide sidebar. */
function Layout(props: any) {
  return <DocWrapper><DocLayout {...props} /></DocWrapper>
}

export const { Page, generateMetadata } = createPage({
  metadata,
  dictionaries,
  categories: [],
  content,
  Layout,
})

export default Page
