import createLayout from '~/site/docs-shell/factories/create-layout'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab, TabBadge } from '~/site/docs-shell/components/Tabs'

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
    <Tabs className="mb-xl">
      <Tab href='/guide/installation/angular'>{$('Static Rendering')} <TabBadge>{$('Default')}</TabBadge></Tab>
      <Tab href='/guide/installation/angular/runtime'>{$('Runtime Rendering')}</Tab>
    </Tabs>,
  Layout,
})

export default Page
