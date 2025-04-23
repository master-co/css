import createPage from '~/internal/factories/create-page'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'

export const { Page, dynamic, revalidate, generateMetadata } = createPage({
    metadata,
    dictionaries,
    categories,
    categoryLink: '/guide/installation/integrations',
    content: import('./content.mdx'),
})

export default Page