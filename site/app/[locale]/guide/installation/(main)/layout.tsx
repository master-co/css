import createLayout from '~/internal/factories/create-layout'
import Layout from 'internal/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab, TabBadge } from '~/internal/components/Tabs'
import metadata from './metadata'

export const { Page, dynamic, revalidate, generateMetadata } = createLayout({
    metadata,
    subtitle: 'Runtime, zero-runtime, or hydration — it’s your call.',
    dictionaries,
    categories,
    noTOC: true,
    content: ({ $ }) =>
        <Tabs className="mb:8x">
            <Tab href='/guide/installation'>{$('Quick Start')} <TabBadge>{$('Recommanded')}</TabBadge></Tab>
            <Tab href='/guide/installation/cli'>{$('Standalone CLI')}</Tab>
            <Tab href='/guide/installation/cdn'>{$('Runtime CDN')}</Tab>
            <Tab href='/guide/installation/integrations'>{$('Integrations')}</Tab>
        </Tabs>,
    Layout,
})

export default Page
