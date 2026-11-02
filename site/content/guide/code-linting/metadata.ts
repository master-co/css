import define from '@master/internal-site/utils/metadata'

const metadata = define({
  title: {
    absolute: 'Code linting for Master CSS'
  },
  description: 'Use ESLint to validate Master CSS classes, detect conflicts, sort class lists and apply project policies.',
  category: 'Authoring',
  other: {
    subject: 'Code linting'
  },
  order: 5,
  openGraph: {
    description: 'An ESLint plugin enforcing a consistent coding style for Master CSS.'
  },
  fileURL: import.meta.url
})

export default metadata
