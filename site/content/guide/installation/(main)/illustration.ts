/** The quick start's setup model, reused by the drawing and its portable text equivalent. */
export const installationIllustration = {
  title: 'Connect your source to the page',
  alt: 'App markup and an app stylesheet both feed the build integration. The resulting CSS travels to a page displaying Hello World.',
  caption: 'The integration reads class names from source and definitions from your stylesheet. Your app must load that stylesheet for the resulting CSS to reach the page.',
  labels: {
    markup: 'App markup',
    className: 'class="p-md"',
    stylesheet: 'App stylesheet',
    import: "@import '@master/css';",
    integration: 'Integration',
    css: 'CSS',
    page: 'Your page',
    result: 'Hello World'
  },
  description: [
    { title: 'Source', text: 'A complete class such as p-md appears in a source file the integration scans. The app stylesheet imports @master/css to supply the preset definitions.' },
    { title: 'Build integration', text: 'The two source artifacts feed the configured integration, which generates CSS for the recognized classes. The installer configures this connection; the integration does the ongoing development and build work.' },
    { title: 'Page', text: 'The app loads its stylesheet so the resulting CSS reaches the browser. The p-md rule applies 1rem of padding with the preset. Package installation alone does not establish the stylesheet import.' }
  ]
} as const

export function installationIllustrationMarkdown() {
  return `**${installationIllustration.title}**\n\n${installationIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${installationIllustration.caption}`
}
