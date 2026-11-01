/** Shared labels and text equivalent for the actual fixed/content-sized textarea comparison. */
export const compatibilityIllustration = {
  title: 'The enhancement changes the size, not access to the note',
  alt: 'A feature query branches to two textareas with the same six-line note. The fallback shows a shorter scrollable field; the supported field grows to show all six lines.',
  caption: 'Same note, same width and limits. Without the enhancement the field scrolls; with it the field grows, then scrolls at the maximum height.',
  labels: {
    query: '@supports (field-sizing: content)',
    fallback: 'Not supported',
    enhanced: 'Supported',
    fallbackNote: 'Initial size · scroll to read',
    enhancedNote: 'Grows with the note',
    note: 'Plan the next release.\nReview the draft.\nCheck the examples.\nTest with a keyboard.\nVerify the small screen.\nPublish when ready.'
  },
  description: [
    { title: 'Shared baseline', text: 'Both textareas contain the same six lines and have the same width, padding and height limits. The control remains editable, vertically resizable and scrollable.' },
    { title: 'Query does not match', text: 'The field uses its ordinary initial size. Some lines are below the visible area, but scrolling still reaches them.' },
    { title: 'Query matches', text: 'The field-sizing: content declaration lets the field grow with the note. A maximum height stops further growth; longer notes then scroll.' }
  ]
} as const

export function compatibilityIllustrationMarkdown() {
  return `**${compatibilityIllustration.title}**\n\n${compatibilityIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${compatibilityIllustration.caption}`
}
