import createLayout from '~/internal/factories/create-layout'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab } from '~/internal/components/Tabs'
import metadata from './metadata'

export const { Page, dynamic, revalidate, generateMetadata } = createLayout({
    metadata,
    subtitle: 'Runtime, zero-runtime, or hydration — it’s your call.',
    dictionaries,
    categories,
    noTOC: true,
    content: ({ $ }) =>
        <Tabs className="mb:xl">
            <Tab href='/guide/installation'>{$('Quick Start')}</Tab>
            <Tab href='/guide/installation/integrations'>{$('Integrations')}</Tab>
            <Tab href='/guide/installation/cdn'>{$('CDN')}</Tab>
            <Tab href='/guide/installation/cli'>{$('CLI')}</Tab>
        </Tabs>,
    Layout,
})

export default Page
