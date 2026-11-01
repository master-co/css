/** Shared evidence for authored Reference figures and their portable text. */
export const referenceIllustrations = {
  'native-value-boundary': {
    title: 'A quoted parenthesis stays inside the value',
    alt: 'The content property, quoted closing parenthesis and before pseudo-element are marked within one intact class.',
    caption: 'The first closing parenthesis is quoted value text. The next one closes the declaration; ::before begins outside it.',
    labels: {
      source: 'One HTML class', property: 'Property', value: 'Quoted value', selector: 'Selector',
      propertyDetail: 'Full CSS name', valueDetail: 'A literal ) character', selectorDetail: 'Outside the head',
      output: "content: ')';", result: 'Declaration on ::before'
    },
    description: [
      'In (content:\')\')::before, content is the property and \')\' is its quoted value.',
      'The ) inside the string is preserved. The next ) closes the native declaration head.',
      'The ::before suffix targets the pseudo-element. Its generated declaration is content: \')\';.'
    ]
  },
  'selector-targets': {
    title: 'The same hover, different targets',
    alt: 'Two identical articles have their first link hovered. Testing hover on the article underlines both links; testing hover on each link underlines only the first.',
    caption: 'The first link is hovered in both specimens. Dashed blue contours identify the element matching the suffix’s :hover test, not a generated border.',
    labels: {
      invariant: 'The first link is hovered in both cases',
      ownerClass: 'underline:hover>a', targetClass: 'underline>a:hover',
      ownerTest: 'Test on the article', targetTest: 'Test on each link',
      article: 'Documentation', firstLink: 'Installation and setup', secondLink: 'API reference',
      ownerResult: 'Both links are underlined', targetResult: 'Only the hovered link is underlined'
    },
    description: [
      'Both articles carry the utility class and contain the same two direct child links. Their first link is hovered; both ancestor articles therefore also match :hover.',
      'underline:hover>a tests the article, then selects its direct child links. Both links receive text-decoration-line: underline.',
      'underline>a:hover selects direct child links, then tests each link. Only the hovered first link receives the declaration.',
      'The dashed blue contours identify the element matching the hover test. They do not represent a generated border or imply that the second article is not hovered.'
    ]
  }
} as const

export type ReferenceIllustrationId = keyof typeof referenceIllustrations

export function referenceIllustrationMarkdown(id: string) {
  const figure = referenceIllustrations[id as ReferenceIllustrationId]
  if (!figure) throw new Error(`Unknown Reference illustration: ${id}`)
  return `<!-- reference-illustration:${id} -->\n\n**${figure.title}**\n\n${figure.caption}\n\n${figure.description.map(item => `- ${item}`).join('\n')}\n\n<!-- /reference-illustration -->`
}
