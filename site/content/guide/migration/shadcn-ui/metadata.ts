import define from '@master/internal-site/utils/metadata'

const metadata = define({
  title: 'Migrating from shadcn/ui',
  description: 'Move shadcn/ui components to Master CSS while their primitives keep behavior, the theme variables stay shared, and caller overrides resolve through cascade layers.',
  category: 'Migration',
  fileURL: import.meta.url
})

export default metadata
