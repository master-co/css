export const cssMigrationIllustration = {
  title: 'Change the authoring, preserve the result',
  alt: 'A CSS rule declares gap 1rem, padding 1.5rem and radius 0.5rem. Markup classes gap-md, p-lg and r-lg supply the same values from the preset. Both paths produce the same neutral Account card.',
  caption: 'Compare the declarations and computed result. A similarly named token is not enough: the value, scheme and interaction state must match.',
  labels: { css: 'Card.module.css', markup: 'Card.tsx', gap: 'gap: 1rem;', padding: 'padding: 1.5rem;', radius: 'border-radius: .5rem;', classes: 'gap-md p-lg r-lg', roles: 'bg-surface-raised fg-text-body', result: 'Same computed styles', title: 'Account', body: 'Review profile settings.' },
  description: [
    { title: 'Start from values', text: 'The CSS rule supplies 1rem gap, 1.5rem padding and 0.5rem radius.' },
    { title: 'Match the preset', text: 'gap-md, p-lg and r-lg supply those values. Both versions use the same surface and text roles.' },
    { title: 'Preserve the result', text: 'The card keeps its layout, content and colors. Only the location of its styling decisions changes.' }
  ]
} as const
export function cssMigrationIllustrationMarkdown() {
  return `**${cssMigrationIllustration.title}**\n\n${cssMigrationIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${cssMigrationIllustration.caption}`
}
