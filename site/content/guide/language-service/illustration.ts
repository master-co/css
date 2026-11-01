/** Shared by the drawing, accessible description, search and Markdown export. */
export const languageIllustration = {
  "title": "Project definitions become editor vocabulary",
  "alt": "The spacing-card token in app.css supplies the p-card completion in an HTML class attribute. After accepting the suggestion, hovering p-card shows padding: var(--spacing-card).",
  "caption": "One project token, two editor checks: complete its class name, then inspect the declaration. The editor preview does not establish what wins in the browser.",
  "labels": {
    "source": "app.css",
    "context": "Project context",
    "token": "--spacing-card: 1.5rem;",
    "completion": "1  Complete the class",
    "prefix": "p-ca",
    "className": "p-card",
    "hover": "2  Hover the accepted class",
    "declaration": "padding: var(--spacing-card);",
    "note": "Relevant rule shown; layer wrapper omitted"
  },
  "description": [
    {
      "title": "Define",
      "text": "The app stylesheet imports @master/css and declares --spacing-card: 1.5rem in @theme."
    },
    {
      "title": "Complete",
      "text": "Inside an HTML class attribute, p-ca receives the project-aware completion p-card."
    },
    {
      "title": "Inspect",
      "text": "Hovering p-card shows its generated padding: var(--spacing-card) declaration. The framework integration still supplies CSS to the page; verify the rendered result separately."
    }
  ]
} as const

export function languageIllustrationMarkdown() {
  const figure = languageIllustration
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
