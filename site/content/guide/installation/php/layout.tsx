import createHeaderIcon from '~/site/docs-shell/factories/create-header-icon'
import createLayout from '~/site/docs-shell/factories/create-layout'
import Layout from '~/site/layouts/doc'
import dictionaries from '~/site/dictionaries'
import categories from '~/site/.categories/guide.json'
import Tabs, { Tab, TabBadge } from '~/site/docs-shell/components/Tabs'

export const { Page, generateMetadata } = createLayout({
  metadata: {
    title: 'Set up Master CSS in PHP',
    description: 'Guide to setting up Master CSS in plain PHP or CodeIgniter projects.',
    category: 'Integrations'
  },
  dictionaries,
  categories,
  noTOC: true,
  categoryLink: '/guide/installation/integrations',
  icon: createHeaderIcon('php'),
  content: ({ $ }) =>
    <Tabs className="mb-xl">
      <Tab href='/guide/installation/php'>{$('Static Rendering')} <TabBadge>{$('Default')}</TabBadge></Tab>
      <Tab href='/guide/installation/php/runtime'>{$('Runtime Rendering')}</Tab>
    </Tabs>,
  Layout,
})

export default Page
