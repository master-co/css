import createLayout from '~/internal/factories/create-layout'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab } from '~/internal/components/Tabs'

export const { Page, dynamic, revalidate, generateMetadata } = createLayout({
    metadata: {
        title: 'Set up Master CSS in WordPress',
        description: 'Guide to setting up Master CSS in your WordPress theme.',
        category: 'Integrations'
    },
    dictionaries,
    categories,
    noTOC: true,
    categoryLink: '/guide/installation/integrations',
    icon: 'wordpress',
    content: ({ $ }) =>
        <Tabs className="mb:xl">
            <Tab href='/guide/installation/wordpress'>{$('Runtime Rendering')}</Tab>
            <Tab href='/guide/installation/wordpress/static-rendering'>{$('Static Rendering')}</Tab>
        </Tabs>,
    Layout,
})

export default Page
