export const colorIllustration = {
  title: 'The role stays the same as the scheme changes',
  alt: 'The same surface, border, heading and secondary text appear in light and dark regions. Both use bg-surface-raised, b-line-divider, fg-text-strong and fg-text-muted; their resolved colors change with the local color scheme.',
  caption: 'Choose the role once. Its light-dark() value follows the element’s color scheme, including a local region inside another scheme.',
  labels: { light: 'Light scheme', dark: 'Dark scheme', title: 'Project updates', body: 'Three milestones changed this week.', surface: 'bg-surface-raised', line: 'b-line-divider', strong: 'fg-text-strong', muted: 'fg-text-muted', same: 'Identical classes' },
  description: [
    { title: 'Preserve the role', text: 'Both regions use the same surface, divider, strong-text and muted-text classes.' },
    { title: 'Resolve locally', text: 'The role values use light-dark(). Each region’s color-scheme selects its light or dark colors without changing the classes.' }
  ]
} as const
export function colorIllustrationMarkdown() {
  return `**${colorIllustration.title}**\n\n${colorIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${colorIllustration.caption}`
}
