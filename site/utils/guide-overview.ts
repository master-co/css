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
  { id: 'getting-started', category: 'Getting started', title: 'Getting started', description: 'Install Master CSS and get your first project running.' },
  { id: 'agentic-workflows', category: 'Agentic workflows', title: 'Agentic workflows', description: 'Set up your editor and work with AI coding agents.' },
  { id: 'authoring', category: 'Authoring', title: 'Authoring', description: 'Organize theme tokens, styles and reusable packages.' },
  { id: 'fundamentals', category: 'Fundamentals', title: 'Fundamentals', description: 'Understand project context, rendering, layers and view transitions.' },
  { id: 'design-foundations', category: 'Design foundations', title: 'Design foundations', description: 'Build responsive interfaces with consistent layout, color and type.' },
  { id: 'build-and-delivery', category: 'Build and delivery', title: 'Build and delivery', description: 'Prepare and optimize your styles for production.' }
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

export function guideOverviewMarkdown(categories: GuideCategory[], t: (text: string) => string = text => text) {
  return guideOverviewSections(categories).map(section => [
    ...(section.id === 'getting-started' ? ['<a id="syntax-tutorial"></a>', ''] : []),
    `## ${t(section.title)} {#${section.id}}`, '', t(section.description), '',
    ...section.entries.map(entry => `- [${entry.title}](${entry.url})${entry.description ? `: ${entry.description}` : ''}`)
  ].join('\n')).join('\n\n')
}
