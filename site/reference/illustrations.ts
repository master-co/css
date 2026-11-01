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
  }
} as const

export type ReferenceIllustrationId = keyof typeof referenceIllustrations

export function referenceIllustrationMarkdown(id: string) {
  const figure = referenceIllustrations[id as ReferenceIllustrationId]
  if (!figure) throw new Error(`Unknown Reference illustration: ${id}`)
  return `<!-- reference-illustration:${id} -->\n\n**${figure.title}**\n\n${figure.caption}\n\n${figure.description.map(item => `- ${item}`).join('\n')}\n\n<!-- /reference-illustration -->`
}
