import createLayout from '~/internal/factories/create-layout'
import Layout from 'internal/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab, TabBadge } from '~/internal/components/Tabs'

export const { Page, dynamic, revalidate, generateMetadata } = createLayout({
    metadata: {
        title: 'Set up Master CSS in Next.js',
        description: 'Guide to setting up Master CSS in your Next.js project.',
        category: 'Integrations'
    },
    dictionaries,
    categories,
    noTOC: true,
    categoryLink: '/guide/installation/integrations',
    brandName: 'nextjs',
    content: ({ $ }) =>
        <Tabs className="mb:8x">
            <Tab href='/guide/installation/nextjs'>{$('Progressive Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
            <Tab href='/guide/installation/nextjs/runtime-rendering'>{$('Runtime Rendering')}</Tab>
            <Tab href='/guide/installation/nextjs/static-extraction'>{$('Static Extraction')}</Tab>
        </Tabs>,
    Layout,
})

export default Page
