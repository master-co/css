export const transitionIllustration = {
  title: 'Keep the image connected across layouts',
  alt: 'A small image in an article collection and a larger image in the detail view share the view-transition-name article-aurora-image. The matching name connects the old and new captures even though the DOM and layout change.',
  caption: 'The browser matches captures by name. The old and new elements may be different DOM nodes; each rendered state must use the name only once.',
  labels: { before: 'Collection · old state', after: 'Detail · new state', title: 'Preserving context', more: 'Read article', description: 'A closer look at the same story.', name: 'article-aurora-image', property: 'view-transition-name', match: 'One name, two states' },
  description: [
    { title: 'Capture the collection', text: 'The selected article image has the name article-aurora-image in the old state.' },
    { title: 'Update the DOM', text: 'Replace the collection with the detail view inside the transition callback. The detail image uses the same name.' },
    { title: 'Match the captures', text: 'The browser can animate the image between its old and new bounds. The name identifies the pair, not a requirement to keep the same DOM node.' }
  ]
} as const
export function transitionIllustrationMarkdown() {
  return `**${transitionIllustration.title}**\n\n${transitionIllustration.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${transitionIllustration.caption}`
}
