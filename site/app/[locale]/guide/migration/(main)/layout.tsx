import createLayout from '~/internal/factories/create-layout'
import Layout from 'internal/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab } from '~/internal/components/Tabs'
import metadata from './metadata'

export const { Page, dynamic, revalidate, generateMetadata } = createLayout({
    metadata,
    dictionaries,
    categories,
    noTOC: true,
    content: ({ $ }) =>
        <Tabs className="mb:xl">
            <Tab href='/guide/migration'>{$('Quick Start')}</Tab>
            <Tab href='/guide/migration/frameworks'>{$('Frameworks')}</Tab>
        </Tabs>,
    Layout,
})

export default Page
