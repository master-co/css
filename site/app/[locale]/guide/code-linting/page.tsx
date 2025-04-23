import createPage from '~/internal/factories/create-page'
import Layout from 'internal/layouts/doc'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import ESLintSvg from '~/site/public/icons/eslint.svg'

export const { Page, dynamic, revalidate, generateMetadata } = createPage({
    metadata,
    dictionaries,
    categories,
    noTOC: true,
    icon: 'eslint',
    content: import('./content.mdx'),
    Layout,
})

export default Page