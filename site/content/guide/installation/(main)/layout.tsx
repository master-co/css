import createLayout from '~/site/docs-shell/factories/create-layout'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab } from '~/site/docs-shell/components/Tabs'
import metadata from './metadata'

export const { Page, generateMetadata } = createLayout({
  metadata,
  subtitle: 'Start with static CSS; choose runtime or progressive rendering when your application needs it.',
  dictionaries,
  categories,
  noTOC: true,
  content: ({ $ }) =>
    <Tabs className="mb-xs">
      <Tab href='/guide/installation'>{$('Quick Start')}</Tab>
      <Tab href='/guide/installation/integrations'>{$('Integrations')}</Tab>
      <Tab href='/guide/installation/cdn'>{$('CDN')}</Tab>
      <Tab href='/guide/installation/cli'>{$('CLI')}</Tab>
    </Tabs>,
  Layout,
})

export default Page
