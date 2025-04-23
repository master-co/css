import LogoSvg from '~/site/public/icons/visualstudiocode.svg'
import createPage from '~/internal/factories/create-page'
import Layout from 'internal/layouts/doc'
import metadata from './metadata'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'

export const { Page, dynamic, revalidate, generateMetadata } = createPage({
    metadata,
    dictionaries,
    categories,
    icon: <LogoSvg width={70} />,
    categoryLink: '/guide/code-linting',
    importContent: import('./content.mdx'),
    Layout,
})

export default Page