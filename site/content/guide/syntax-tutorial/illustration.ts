/** One content record for the anatomy figure, accessible description and portable output. */
export const syntaxIllustration = {
  title: 'Read the style, selector and condition',
  alt: 'The intact class fg-blue-60:hover@sm has three bracketed ranges: fg-blue-60 is the style, :hover the selector, and @sm the condition.',
  caption: 'The color applies to the hovered element only while the viewport matches sm. Both suffixes belong to this class.',
  labels: {
    source: 'One HTML class',
    style: 'Style',
    styleCode: 'fg-blue-60',
    styleResult: 'Text color: blue-60',
    selector: 'Selector',
    selectorCode: ':hover',
    selectorResult: 'Hovered element',
    condition: 'Condition',
    conditionCode: '@sm',
    conditionResult: 'Viewport matches sm'
  },
  description: [
    { title: 'Style', text: 'fg-blue-60 sets color to var(--color-blue-60).' },
    { title: 'Selector', text: ':hover matches the class-bearing element while it is hovered.' },
    { title: 'Condition', text: '@sm wraps the rule in the preset’s named sm media query. The selector and condition must both match for this class to apply.' }
  ]
} as const

export function syntaxIllustrationMarkdown() {
  return `**${syntaxIllustration.title}**\n\n${syntaxIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${syntaxIllustration.caption}`
}
