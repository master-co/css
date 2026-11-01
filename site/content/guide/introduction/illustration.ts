/** One record for the drawing, its text equivalent, search and portable output. */
export const introductionIllustration = {
  title: 'A class selects the style; a token supplies the value',
  alt: 'The p-lg class in HTML connects to the .p-lg selector in generated CSS. The theme token --spacing-lg, valued at 1.5rem, connects to its var() reference in the padding declaration.',
  caption: 'Matching names connect the pieces: p-lg selects the rule, and var(--spacing-lg) reads the shared value. The figure shows the relevant declaration; the complete output below includes its layers.',
  labels: {
    markup: 'In your markup',
    theme: 'In the preset theme',
    output: 'Generated CSS · relevant rule',
    className: 'p-lg',
    tokenName: '--spacing-lg',
    tokenValue: '1.5rem'
  },
  description: [
    { title: 'Class match', text: 'The HTML class p-lg matches the generated selector .p-lg. The blue bracket and line connect those two occurrences.' },
    { title: 'Shared value', text: 'The preset defines --spacing-lg as 1.5rem. The violet bracket and line connect its definition to the reference in padding: var(--spacing-lg).' },
    { title: 'Browser result', text: 'The browser resolves the CSS variable and applies 1.5rem of padding on all four sides. The generated rule keeps the variable reference rather than copying its value into the declaration.' }
  ]
} as const

export function introductionIllustrationMarkdown() {
  return `**${introductionIllustration.title}**\n\n${introductionIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${introductionIllustration.caption}`
}
