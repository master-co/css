import define from 'internal/utils/metadata'

const metadata = define({
  title: {
    absolute: 'Language Service for Master CSS'
  },
  description: 'Use manifest-aware editor intelligence for Master CSS classes, directives, project tokens, generated CSS previews, colors, and workspace-specific configuration.',
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
