import createLayout from '~/internal/factories/create-layout'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab, TabBadge } from '~/internal/components/Tabs'

export const { Page, dynamic, revalidate, generateMetadata } = createLayout({
    metadata: {
        title: 'Set up Master CSS in Rspack',
        description: 'Guide to setting up Master CSS in your Rspack project.',
        category: 'Integrations'
    },
    dictionaries,
    categories,
    noTOC: true,
    categoryLink: '/guide/installation/integrations',
    icon: 'rspack',
    content: ({ $ }) =>
        <Tabs className="mb:xl">
            <Tab href='/guide/installation/rspack'>{$('Runtime Rendering')} <TabBadge>{$('Default')}</TabBadge></Tab>
            <Tab href='/guide/installation/rspack/static-rendering'>{$('Static Rendering')}</Tab>
        </Tabs>,
    Layout,
})

export default Page
