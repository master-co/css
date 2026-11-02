import define from '@master/internal-site/utils/metadata'

const metadata = define({
  title: {
    absolute: 'Language service for Master CSS'
  },
  description: 'Set up VS Code, confirm project-aware token completion, inspect generated CSS, and configure class sources and workspaces.',
  category: 'Agentic workflows',
  other: {
    subject: 'Language service'
  },
  order: 1,
  openGraph: {
    description: 'Set up VS Code, confirm project-aware token completion, inspect generated CSS, and configure class sources and workspaces.'
  },
  fileURL: import.meta.url
})

export default metadata
