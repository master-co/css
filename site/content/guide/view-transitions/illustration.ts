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

export const transitionStudies = {
  'capture-lifecycle': {
    title: 'The DOM changes before the animation begins',
    alt: 'An old image is captured, the DOM becomes the detail view, and the old and new views animate in an overlay above that updated DOM.',
    caption: 'The callback commits the new view. The browser then animates a temporary overlay; it does not gradually replace the DOM.',
    labels: ['Capture old', 'Commit update', 'Animate overlay', 'Collection', 'Detail', 'Old image', 'New view', 'DOM', 'Already updated', 'startViewTransition(update)', 'updateCallbackDone', 'ready', 'finished', 'Visual handoff'],
    description: [
      { title: 'Before the update', text: 'The browser captures the old collection, including its separately named image.' },
      { title: 'Inside the callback', text: 'The application replaces the collection with the detail DOM. updateCallbackDone reports completion of this update.' },
      { title: 'After capture', text: 'The pseudo-element overlay blends the old image and new view. ready marks animation readiness; finished also resolves when animation is skipped.' }
    ]
  },
  'capture-identity': {
    title: 'Names pair captures; classes group their styling',
    alt: 'Two distinct names pair across successive states under one shared article transition class. A separate state with two identical names is marked invalid.',
    caption: 'Identity must be unique in each state. A transition class can be shared by every named capture in a feature.',
    labels: ['Old state', 'New state', 'image', 'title', 'article-aurora-image', 'article-aurora-title', 'view-transition-class: article', 'One styling group, two identities', 'Duplicate in one state', 'hero', 'hero', 'Skipped', 'Unique within each state'],
    description: [
      { title: 'Match names', text: 'article-aurora-image pairs with the same name in the new state; the title has a different, independently matched name.' },
      { title: 'Share styling', text: 'Both named elements carry view-transition-class: article. ::view-transition-group(.article) can style both groups, independently of their HTML classes.' },
      { title: 'Reject duplicates', text: 'Two rendered elements named hero in the same captured state are ambiguous. The animation is skipped; the application update can still complete.' }
    ]
  },
  'capture-tree': {
    title: 'One capture becomes a group and an image pair',
    alt: 'A document-root pseudo-element tree connects group geometry to a moving image rectangle, and old and new children to the two images blended inside it.',
    caption: 'The group moves and resizes. Its old and new children control how the two views blend inside those bounds.',
    labels: ['Document root', '::view-transition', '::view-transition-group(root)', '::view-transition-group(hero)', '::view-transition-image-pair(hero)', '::view-transition-old(hero)', '::view-transition-new(hero)', 'Position and size', 'Old', 'New', 'Blend inside the group', 'Root capture', 'Named image: hero', 'Layers shown apart'],
    description: [
      { title: 'Attach to the root', text: 'Document transitions generate their pseudo-elements at the document root, not beneath the original card element.' },
      { title: 'Move the group', text: 'The hero group animates between the old and new bounds. Its image-pair child contains the outgoing and incoming images.' },
      { title: 'Blend the views', text: 'Old and new children animate their image content. The separate root group holds the remaining page capture; missing old or new children represent entering or exiting captures.' }
    ]
  },
  'capture-navigation': {
    title: 'Two triggers, the same named visual handoff',
    alt: 'One document changes from list to detail through a callback. In a separate lane, an ordinary link connects two same-origin documents that both opt in.',
    caption: 'Use startViewTransition() for a DOM update. Use an ordinary navigation and CSS opt-in when the destination is another document.',
    labels: ['Same document', 'Cross document', 'Collection', 'Detail', 'One document', 'DOM update', 'startViewTransition(update)', 'Document A', 'Document B', 'Link navigation', 'Same origin · both opt in', '@view-transition', 'navigation: auto', 'Explicit names match in both views'],
    description: [
      { title: 'Update in place', text: 'startViewTransition(update) wraps a change to the current document. A client router that replaces its DOM follows this same-document path.' },
      { title: 'Navigate normally', text: 'An eligible same-origin navigation connects two documents. Both load @view-transition { navigation: auto; }; no startViewTransition callback is needed.' },
      { title: 'Retain a usable destination', text: 'Explicit matching names can connect separate nodes in either path. Unsupported transitions leave the DOM update or ordinary link navigation usable.' }
    ]
  }
} as const

export type TransitionStudyName = keyof typeof transitionStudies

export function transitionStudyMarkdown(name?: string) {
  if (!name) return transitionIllustrationMarkdown()
  const figure = transitionStudies[name as TransitionStudyName]
  if (!figure) throw new Error(`Unknown transition illustration: ${name}`)
  return `**${figure.title}**\n\n${figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')}\n\n${figure.caption}`
}
