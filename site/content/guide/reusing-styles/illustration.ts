/** Shared editorial content for the figure, its accessible description, and portable exports. */
export const reuseIllustration = {
  title: 'One definition, two uses',
  alt: 'The action component connects to both buttons. The px-lg utility connects only to the second button.',
  caption: 'Both buttons share .action. Only the second requests px-lg, so its horizontal padding comes from the utility.',
  labels: {
    component: 'Component definition',
    componentClass: '.action',
    componentScope: 'Appearance, states and default spacing',
    utility: 'Local utility',
    utilityClass: 'px-lg',
    utilityScope: 'Overrides horizontal padding',
    shared: 'Both instances',
    local: 'Only this instance',
    first: 'Shared component',
    firstMarkup: 'class="action"',
    firstResult: 'Component padding',
    second: 'Local adjustment',
    secondMarkup: 'class="action px-lg"',
    secondResult: 'Utility padding'
  },
  description: [
    { title: 'Shared definition', text: 'The native .action rule in the components layer supplies appearance, interaction states and default padding to both buttons.' },
    { title: 'First instance', text: 'class="action" uses the component’s horizontal padding.' },
    { title: 'Second instance', text: 'class="action px-lg" also requests a utility. The utilities layer follows components, so px-lg overrides horizontal padding on this instance while the other component styles still apply.' }
  ]
} as const

export function reuseIllustrationMarkdown() {
  return `**${reuseIllustration.title}**\n\n${reuseIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${reuseIllustration.caption}`
}
