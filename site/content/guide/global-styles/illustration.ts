/** Source ownership is shared by the drawing, accessible text and portable output. */
export const globalIllustration = {
  title: 'Several source files, one app entry',
  alt: 'The application loads app.css. Its imports collect theme.css, defaults.css and components.css into the same Master CSS entry graph. Each file keeps its own styling responsibility.',
  caption: 'Load the app entry from the application root. Split the source by ownership; each imported file does not need another @import of @master/css.',
  labels: {
    root: 'App root', entry: 'app.css', theme: 'theme.css', defaults: 'defaults.css', components: 'components.css',
    themeBody: '@theme { … }', defaultsBody: '@layer defaults { … }', componentsBody: '@layer components { … }',
    shared: 'One entry graph', definitions: 'Shared values', native: 'Document defaults', roles: 'Shared component rules'
  },
  description: [
    { title: 'Load once', text: 'The application root loads app.css, which starts with the default @import of @master/css.' },
    { title: 'Split by ownership', text: 'app.css imports theme.css for shared values, defaults.css for native document defaults, and components.css for shared component rules.' },
    { title: 'Keep one graph', text: 'These imports assemble one entry graph. The three source files do not each need a full Master CSS entry import.' }
  ]
} as const

export function globalIllustrationMarkdown() {
  return `**${globalIllustration.title}**\n\n${globalIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${globalIllustration.caption}`
}
