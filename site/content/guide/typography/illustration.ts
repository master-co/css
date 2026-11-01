export const typeIllustration = {
  title: 'The same size can have a different rhythm',
  alt: 'Two copies of Make room for details use the same 32px font size. font-3xl inherits 1.6 line height and normal tracking; text-3xl sets 1.25 line height and minus 0.02em tracking, producing a more compact two-line block.',
  caption: 'Actual preset typography at a 16px root size. Each row marks a line box; font-size alone does not describe the spacing between lines.',
  labels: { first: 'Make room', second: 'for details.', font: 'font-3xl', text: 'text-3xl', shared: 'Same font · 32px · regular weight', inherited: 'Inherited: 1.6 / normal', treatment: 'Treatment: 1.25 / −0.02em', parent: 'Parent: leading-md tracking-normal' },
  description: [
    { title: 'Font size only', text: 'font-3xl sets the size to 2rem. In this parent it inherits line-height 1.6 and normal letter spacing.' },
    { title: 'Complete treatment', text: 'text-3xl sets the same 2rem size plus line-height 1.25 and letter-spacing -0.02em.' },
    { title: 'Compare the line boxes', text: 'With a 16px root size, the examples have 32px text and line heights of 51.2px and 40px. The same two lines occupy different heights.' }
  ]
} as const
export function typeIllustrationMarkdown() {
  return `**${typeIllustration.title}**\n\n${typeIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${typeIllustration.caption}`
}
