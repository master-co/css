import createPage from '~/internal/factories/create-page'
import Layout from 'internal/layouts/doc'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'

export const { Page, dynamic, revalidate, generateMetadata } = createPage({
    metadata,
    dictionaries,
    categories,
    subtitle: 'It can be runtime, zero-runtime, or even hydration.',
    content: import('./content.mdx'),
    Layout,
})

export default Page