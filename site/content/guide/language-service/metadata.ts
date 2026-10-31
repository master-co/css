import define from '~/site/docs-shell/utils/metadata'

const metadata = define({
  title: {
    absolute: 'Language Service for Master CSS'
  },
  description: 'Set up Visual Studio Code and use manifest-aware completion, generated CSS previews, highlighting, colors and directive formatting for Master CSS.',
  category: 'Agentic Workflows',
  other: {
    subject: 'Language Service'
  },
  order: 1,
  openGraph: {
    description: 'Manifest-aware completion, hover previews, highlighting, color tools, directive diagnostics, and manifest diagnostics for Master CSS.'
  },
  fileURL: import.meta.url
})

export default metadata
