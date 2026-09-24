import createLayout from '~/site/docs-shell/factories/create-layout'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab } from '~/site/docs-shell/components/Tabs'

export const { Page, dynamic, revalidate, generateMetadata } = createLayout({
  metadata: {
    title: 'Set up Master CSS in Blazor',
    description: 'Guide to setting up Master CSS in your Blazor project.',
    category: 'Integrations'
  },
  dictionaries,
  categories,
  noTOC: true,
  categoryLink: '/guide/installation/integrations',
  icon: 'blazor',
  content: ({ $ }) =>
    <Tabs className="mb-xl">
      <Tab href='/guide/installation/blazor'>{$('Static Rendering')}</Tab>
      <Tab href='/guide/installation/blazor/runtime'>{$('Runtime Rendering')}</Tab>
    </Tabs>,
  Layout,
})

export default Page
