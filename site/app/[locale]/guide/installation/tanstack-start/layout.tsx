import createLayout from '~/internal/factories/create-layout'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab, TabBadge } from '~/internal/components/Tabs'

export const { Page, dynamic, revalidate, generateMetadata } = createLayout({
    metadata: {
        title: 'Set up Master CSS in TanStack Start',
        description: 'Guide to setting up Master CSS in your TanStack Start project.',
        category: 'Integrations'
    },
    dictionaries,
    categories,
    noTOC: true,
    categoryLink: '/guide/installation/integrations',
    icon: 'tanstack-start',
    content: ({ $ }) =>
        <Tabs className="mb:xl">
            <Tab href='/guide/installation/tanstack-start'>{$('Runtime Rendering')} <TabBadge>{$('Default')}</TabBadge></Tab>
            <Tab href='/guide/installation/tanstack-start/static-rendering'>{$('Static Rendering')}</Tab>
        </Tabs>,
    Layout,
})

export default Page
