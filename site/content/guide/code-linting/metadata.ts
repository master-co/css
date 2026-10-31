import define from '~/site/docs-shell/utils/metadata'

const metadata = define({
  title: {
    absolute: 'Code Linting for Master CSS'
  },
  description: 'Use ESLint to validate Master CSS classes, detect conflicts, sort class lists and apply project policies.',
  category: 'Authoring',
  other: {
    subject: 'Code Linting'
  },
  order: 5,
  openGraph: {
    description: 'An ESLint plugin enforcing a consistent coding style for Master CSS.'
  },
  fileURL: import.meta.url
})

export default metadata
