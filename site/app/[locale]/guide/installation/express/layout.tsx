import createLayout from '~/site/docs-shell/factories/create-layout'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab } from '~/site/docs-shell/components/Tabs'

export const { Page, dynamic, revalidate, generateMetadata } = createLayout({
  metadata: {
    title: 'Set up Master CSS in Express',
    description: 'Guide to setting up Master CSS in Express server-rendered templates.',
    category: 'Integrations'
  },
  dictionaries,
  categories,
  noTOC: true,
  categoryLink: '/guide/installation/integrations',
  icon: 'express',
  content: ({ $ }) =>
    <Tabs className="mb-xl">
      <Tab href='/guide/installation/express'>{$('Static Rendering')}</Tab>
      <Tab href='/guide/installation/express/progressive'>{$('Progressive Rendering')}</Tab>
    </Tabs>,
  Layout,
})

export default Page
