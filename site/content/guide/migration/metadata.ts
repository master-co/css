import define from '@master/internal-site/utils/metadata'

const metadata = define({
  title: {
    absolute: 'Migrating to Master CSS'
  },
  description: 'Convert one component or route, verify the screens sharing its styles, and remove old dependencies when their consumers are gone.',
  category: 'Getting started',
  other: {
    subject: 'Migration'
  },
  order: 8,
  fileURL: import.meta.url
})

export default metadata
