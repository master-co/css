import createLayout from '~/internal/factories/create-layout'
import Layout from 'internal/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab, TabBadge } from '~/internal/components/Tabs'

export const { Page, dynamic, revalidate, generateMetadata } = createLayout({
    metadata: {
        title: 'Set up Master CSS in Angular',
        description: 'Guide to setting up Master CSS in your Angular project.',
        category: 'Integrations'
    },
    dictionaries,
    categories,
    noTOC: true,
    categoryLink: '/guide/installation/integrations',
    icon: 'angular',
    content: ({ $ }) =>
        <Tabs className="mb:8x">
            <Tab href='/guide/installation/angular'>{$('Progressive Rendering')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
            <Tab href='/guide/installation/angular/runtime-rendering'>{$('Runtime Rendering')}</Tab>
            <Tab href='/guide/installation/angular/static-extraction'>{$('Static Extraction')}</Tab>
        </Tabs>,
    Layout,
})

export default Page
