export interface GuideCategory {
  name: string
  pages: {
    title: string | { absolute?: string; default?: string }
    pathname: string
    description?: string
    disabled?: boolean
    unfinished?: boolean
  }[]
}

const sections = [
  { id: 'getting-started', category: 'Getting Started', title: 'Getting started', description: 'Install Master CSS and get your first project running.', descriptionTW: '安裝 Master CSS，開始第一個專案。' },
  { id: 'agentic-workflows', category: 'Agentic Workflows', title: 'Agentic workflows', description: 'Set up your editor and work with AI coding agents.', descriptionTW: '設定編輯器，與 AI coding agents 協作開發。' },
  { id: 'authoring', category: 'Authoring', title: 'Authoring', description: 'Organize theme tokens, styles and reusable packages.', descriptionTW: '組織主題 tokens、樣式與可重用的套件。' },
  { id: 'fundamentals', category: 'Fundamentals', title: 'Fundamentals', description: 'Understand rendering, responsive design and the cascade.', descriptionTW: '理解渲染、響應式設計與 CSS cascade。' },
  { id: 'design-foundations', category: 'Design Foundations', title: 'Design foundations', description: 'Build a consistent system for layout, color, type and motion.', descriptionTW: '建立一致的版面、色彩、字體與動態設計。' },
  { id: 'build--delivery', category: 'Build & Delivery', title: 'Build & delivery', description: 'Prepare and optimize your styles for production.', descriptionTW: '為正式環境準備並最佳化樣式。' }
]

export function guideOverviewSections(categories: GuideCategory[]) {
  return sections.map(section => ({
    ...section,
    entries: (categories.find(category => category.name === section.category)?.pages ?? [])
      .filter(page => page.pathname.split('/').length === 3)
      .map(page => ({
        id: page.pathname,
        title: typeof page.title === 'string' ? page.title : page.title.absolute || page.title.default || page.pathname,
        description: page.description,
        category: section.category,
        url: page.pathname,
        disabled: page.disabled,
        unfinished: page.unfinished
      }))
  })).filter(section => section.entries.length)
}

export function guideOverviewMarkdown(categories: GuideCategory[]) {
  return guideOverviewSections(categories).map(section => [
    ...(section.id === 'getting-started' ? ['<a id="syntax-tutorial"></a>', ''] : []),
    `## ${section.title}`, '', section.description, '',
    ...section.entries.map(entry => `- [${entry.title}](${entry.url})${entry.description ? `: ${entry.description}` : ''}`)
  ].join('\n')).join('\n\n')
}
