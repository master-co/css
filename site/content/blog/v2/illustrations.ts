import { releaseTheme } from './examples'

/** One text source for the article's figures and its portable/search equivalents. */
export const releaseFigures = {
  fieldwork: {
    title: 'An idea, given a place on the web',
    alt: 'Fieldwork, an illustrative editorial interface with a main photographic story, two sidebar stories and issue metadata, rendered with Master CSS.',
    caption: 'Fieldwork is an illustrative interface built for this article. It combines Master CSS utilities with native component styles; its accent and story spacing are project tokens. The interior photography was generated for this example.',
    description: ['A journal header and white-oak interior photograph introduce the lead story and a sidebar selection, including “The everyday, considered.” and “Room to make something.”', 'The lead story and sidebar use p-story. Their labels use fg-brand. The same markup and shared definitions produce both theme variants.']
  },
  anatomy: {
    title: 'One class, one precise condition',
    alt: 'The intact class fg-blue-70:hover@sm is divided into its color token, hover selector and media condition, followed by its generated CSS.',
    caption: 'The class keeps the value, selector and condition together. The browser evaluates the generated selector and media query.',
    description: ['fg-blue-70 selects color: var(--color-blue-70). :hover attaches the hover state to the element carrying the class.', '@sm uses the preset media condition (width >= 52.125rem). Both the query and hover state must match.']
  },
  tokens: {
    title: 'One definition, connected decisions',
    alt: 'One theme definition feeds matching light and dark photographic Fieldwork story cards. Both use fg-brand and p-story; the accent changes with the scheme while the spacing stays the same.',
    caption: 'Both cards use the same markup. Native light-dark() selects the accent value; the inspection rulers show the same 1.5rem content inset from p-story.',
    description: [`The stylesheet defines --color-brand as light-dark(${releaseTheme.light}, ${releaseTheme.dark}) and --spacing-story as ${releaseTheme.inset}.`, 'The light card uses the first accent; the dark card uses the second. Both preserve the same content, layout and token names.']
  },
  layers: {
    title: 'A shared component, a local choice',
    alt: 'Two matching story links share a component rule. The second adds px-lg and visibly grows from 1rem to 1.5rem of padding on each side.',
    caption: 'For normal declarations in these layers, utilities take precedence over components. Blue bands are padding inspection guides, not the component’s background.',
    description: ['The .story-link component defines 1rem horizontal padding in the components layer. Both links inherit its shape and typography.', 'The second link adds px-lg from the utilities layer. Its padding becomes 1.5rem on each side; the link text is unchanged.']
  },
  delivery: {
    title: 'The same authoring model, three delivery paths',
    alt: 'Three independent horizontal paths compare source scanning into a stylesheet, rendered HTML with initial CSS and a conditional runtime handoff, and DOM classes generating CSS in the browser.',
    caption: 'These are alternatives, not consecutive steps. Progressive delivery requires a supported rendering path and valid hydration data.',
    description: ['Static: complete source classes are scanned at build time; the browser receives a CSS stylesheet without a Master CSS runtime.', 'Progressive: rendered HTML supplies initial CSS. With a valid stylesheet and page manifest, the default runtime loads its engine when a class outside that covered set appears.', 'Runtime: connected DOM classes feed browser generation. This supports newly introduced class names and includes browser JavaScript.']
  },
  tools: {
    title: 'A diagnosis you can follow into the fix',
    alt: 'An editor view marks p-lg as overridden in a class list containing p-md p-lg. A fix preview removes p-lg and leaves p-md. Editor, lint and MCP labels share the same project context.',
    caption: 'This conflict and replacement come from the real tooling. HTML class order does not decide which padding declaration wins.',
    description: ['For <article class="p-md p-lg">Field notes</article>, the conflict diagnostic reports: Remove class "p-lg"; it is overridden by class "p-md" in generated CSS.', 'The safe fix produces <article class="p-md">Field notes</article>. The editor, lint tools and MCP consult the project’s resolved definitions; applying a preview also checks the source file hashes.']
  }
} as const

export type ReleaseFigureName = keyof typeof releaseFigures

export function releaseFigureMarkdown(name: string) {
  if (!(name in releaseFigures)) throw new Error(`Unknown release figure: ${name}`)
  const figure = releaseFigures[name as ReleaseFigureName]
  return `**${figure.title}**\n\n${figure.description.join('\n\n')}\n\n${figure.caption}`
}
