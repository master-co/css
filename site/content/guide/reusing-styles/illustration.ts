/** Shared editorial content for the figure, its accessible description, and portable exports. */
export const reuseIllustration = {
  title: 'One definition, two uses',
  alt: 'One action definition supplies two Save changes buttons. The second has wider horizontal padding, marked with blue inspection guides, because it also uses px-lg.',
  caption: 'Both buttons share .action. The inspection guides mark horizontal padding: 1rem per side from the component, or 1.5rem with px-lg. The blue guides are annotations, not button styles.',
  labels: {
    component: 'Component definition',
    componentClass: '.action',
    shared: 'Same appearance and states',
    button: 'Save changes',
    firstPadding: '1rem',
    secondPadding: '1.5rem',
    firstMarkup: 'class="action"',
    firstResult: 'Component spacing',
    secondMarkup: 'class="action px-lg"',
    secondResult: 'Only the spacing changes'
  },
  description: [
    { title: 'Shared definition', text: 'The native .action rule in the components layer supplies appearance, interaction states and default padding to both buttons.' },
    { title: 'First instance', text: 'class="action" uses the component’s horizontal padding of 1rem on each side.' },
    { title: 'Second instance', text: 'class="action px-lg" requests 1.5rem of horizontal padding on each side. The utilities layer follows components, so px-lg overrides horizontal padding on this instance while the other component styles still apply. The figure’s blue bands and rulers mark this padding; they are inspection annotations, not styles added by the utility.' }
  ]
} as const

export function reuseIllustrationMarkdown() {
  return `**${reuseIllustration.title}**\n\n${reuseIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${reuseIllustration.caption}`
}
