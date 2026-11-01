export const cascadeIllustration = {
  title: 'A later layer supplies the local padding',
  alt: 'The named layers run from theme through base, defaults, components and utilities. The component declares 1.5rem padding, but p-sm in the later utilities layer supplies 0.75rem on the same element.',
  caption: 'For these normal declarations, utilities wins over components. Class order in the HTML does not change that result.',
  labels: { scope: 'Normal declarations · named layers', theme: 'theme', base: 'base', defaults: 'defaults', components: 'components', utilities: 'utilities', component: 'padding: 1.5rem', utility: 'padding: 0.75rem', element: 'collection-card p-sm', sample: 'Release notes', result: '12px padding', order: 'Later layer' },
  description: [
    { title: 'Establish order', text: 'The preset declares theme, base, defaults, components, utilities in that order.' },
    { title: 'Compare declarations', text: 'The native collection-card component supplies 1.5rem padding. On the same element, p-sm supplies 0.75rem in the later utilities layer.' },
    { title: 'Observe the result', text: 'The utility wins for these normal declarations. With a 16px root font size, the computed padding is 12px.' }
  ]
} as const
export function cascadeIllustrationMarkdown() {
  return `**${cascadeIllustration.title}**\n\n${cascadeIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${cascadeIllustration.caption}`
}
