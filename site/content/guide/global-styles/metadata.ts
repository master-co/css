import define from '@master/internal-site/utils/metadata'

const metadata = define({
  title: 'Global styles',
  description: 'Load one app entry, split shared CSS by ownership, and keep document defaults, component rules and route styles in the right scope.',
  category: 'Authoring',
  order: 2,
  fileURL: import.meta.url
})

export default metadata
