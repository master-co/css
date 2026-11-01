/** Shared evidence for authored Reference figures and their portable text. */
export const referenceIllustrations = {
  'hue-alias-selection': {
    title: 'Hue aliases do not share one step number',
    alt: 'A blue alias connects to step 60 in a blue swatch strip; a yellow alias connects to step 40 in an otherwise identically arranged yellow strip.',
    caption: 'The preset blue alias references blue-60; yellow references yellow-40. The outlines mark those references, not a border added by either background class. Selected palette steps are shown.',
    labels: {
      heading: 'An alias selects a particular palette step',
      prefixes: ['bg-', 'bg-'], hues: ['blue', 'yellow'], selected: [60, 40],
      variables: ['--color-blue-60', '--color-yellow-40'],
      steps: ['10', '20', '40', '60', '80', '90'],
      scope: 'Preset references; neither alias switches with the color scheme.'
    },
    description: [
      'bg-blue reads --color-blue, which references --color-blue-60 in the preset. The blue strip marks step 60.',
      'bg-yellow reads --color-yellow, which references --color-yellow-40. The yellow strip marks step 40 in the same set of displayed steps.',
      'Both strips show actual palette colors at steps 10, 20, 40, 60, 80 and 90. Equal swatch widths are for comparison, not a scale of perceptual distance.',
      'The two alias chains remain the same in light and dark schemes. Redefining an alias or its referenced token can change its result.'
    ]
  },
  'role-value-selection': {
    title: 'One role, two local color schemes',
    alt: 'The two arguments of the muted-text light-dark function connect to light and dark specimens. Both specimens show the same secondary text, using zinc-60 on a light base and zinc-40 on a dark base.',
    caption: 'The used color scheme selects the first or second color. Both specimens keep fg-text-muted and bg-surface-base; the local scheme changes their computed colors.',
    labels: {
      class: 'fg-text-muted', declaration: 'color: var(--color-text-muted)',
      lightValue: 'var(--color-zinc-60)', darkValue: 'var(--color-zinc-40)',
      light: 'color-scheme: light', dark: 'color-scheme: dark',
      sample: 'Secondary text', surface: 'bg-surface-base',
      selection: 'The browser selects a value; the utility is unchanged.'
    },
    description: [
      'fg-text-muted generates color: var(--color-text-muted). Its preset token contains light-dark(var(--color-zinc-60), var(--color-zinc-40)).',
      'The light specimen uses the first argument, --color-zinc-60. The dark specimen uses the second, --color-zinc-40.',
      'Both specimens use bg-surface-base and the same text class. The colored leaders identify the two arguments; they are annotations, not the resulting text colors.',
      'The local used color scheme selects the branch. The comparison does not imply that system media queries follow a manual local theme.'
    ]
  },
  'namespace-lookup': {
    title: 'The same key can select different tokens',
    alt: 'Three independent rows map p-md to spacing-md and padding, max-w-md to container-md and max-width, and font-md to font-size-md and font-size. Each repeats the key md inside a different token name.',
    caption: 'Each row resolves independently. The repeated md is a key within a namespace, not one global value shared by these classes.',
    labels: {
      class: 'Class', token: 'Selected token', property: 'Native property',
      prefixes: ['p-', 'max-w-', 'font-'],
      namespaces: ['--spacing-', '--container-', '--font-size-'],
      properties: ['padding', 'max-width', 'font-size'],
      key: 'md', note: 'Same key · different namespaces',
      qualifier: 'Preset lookup shown; font- also accepts family and weight keys.'
    },
    description: [
      'p-md selects --spacing-md and writes padding: var(--spacing-md).',
      'max-w-md selects --container-md and writes max-width: var(--container-md).',
      'font-md selects --font-size-md and writes font-size: var(--font-size-md). In the preset, md uniquely selects the font-size namespace among the font- families.',
      'The highlighted md fragments are the same key in separate namespaces. The arrows indicate lookup and property mapping, not dependencies between the three rows. The figure omits theme values and layer wrappers; the generated example below includes both.'
    ]
  },
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
  'condition-domains': {
    title: 'The same name measures different boundaries',
    alt: 'A viewport drawn at 64rem contains a smaller 28rem query container. The md media condition refers to the viewport, while the md container condition refers to the inner container.',
    caption: 'The preset’s @md threshold is 64rem; @container(--md) is 28rem. These independent definitions query different boundaries even though both use the name md.',
    viewportRem: 64, containerRem: 28,
    labels: {
      viewport: 'Viewport', media: '@md', viewportWidth: '64rem',
      container: 'Query container', query: '@container(--md)', containerWidth: '28rem',
      child: 'Queried descendant',
      scale: 'Widths use the same drawing scale; 1rem is assumed to be 16px.',
      units: 'Queries retain their native units.'
    },
    description: [
      'The outer boundary represents a viewport at the preset @md minimum width of 64rem.',
      'The inner boundary represents a query container at the independent @container(--md) minimum width of 28rem. The queried element is inside that container.',
      'The two widths use one drawing scale with a 16px initial and root font size. Changing a container sizing token does not change either condition definition.'
    ]
  },
  'shared-source-class': {
    title: 'Removing one source does not remove a shared rule',
    alt: 'Page A has been removed while page B still contains p-md. Only page B has a live connection to the retained padding rule.',
    caption: 'With unchanged definitions and policy, removing page A leaves page B’s reference to p-md. Source ownership changes even though the generated CSS can stay the same.',
    labels: {
      removed: 'Removed source', live: 'Still scanned',
      first: 'page-a.tsx', second: 'page-b.tsx', source: 'className="p-md"',
      output: 'The shared utility remains', selector: '.p-md {', declaration: 'padding: var(--spacing-md);',
      dependency: 'Its --spacing-md theme dependency remains too.',
      lifetime: 'Removing the final source or safelist reference releases the class.'
    },
    description: [
      'Initially page-a.tsx and page-b.tsx both contain the complete p-md class.',
      'Removing page-a.tsx removes only that source contribution. The live connection from page-b.tsx keeps the shared utility and its --spacing-md dependency.',
      'The utility can leave when no current source or safelist retains it. Updating a source replaces its contribution rather than accumulating historical classes.',
      'The diagram shows the retained utility declaration; the theme dependency is described separately rather than reproduced as a complete stylesheet.'
    ]
  },
  'layer-precedence': {
    title: 'Importance reverses layer precedence',
    alt: 'The five layers run from theme to utilities, followed by unlayered CSS. Normal declarations gain priority downward; important declarations gain priority upward.',
    caption: 'Compare declarations of the same importance within author stylesheets. Normal unlayered rules outrank named layers; important named layers outrank important unlayered rules.',
    labels: {
      heading: 'Base order plus unlayered CSS',
      layers: ['theme', 'base', 'defaults', 'components', 'utilities'],
      unlayered: 'Unlayered CSS', normal: 'Normal', important: '!important',
      weaker: 'Weaker', stronger: 'Stronger', direction: 'Arrows point toward higher priority.',
      scope: 'Author stylesheet rules; inline styles, animations and transitions are not shown.'
    },
    description: [
      'The base stylesheet declares theme, base, defaults, components and utilities in that order.',
      'For normal author stylesheet declarations, priority increases from theme toward utilities, with unlayered declarations above every named layer.',
      'For important author stylesheet declarations, priority increases in the opposite direction: theme is strongest among these layers, and unlayered important declarations are weakest.',
      'Layer precedence is compared before selector specificity. The diagram compares each importance group separately, not normal declarations against important declarations or other cascade origins.'
    ]
  },
  'inline-resolution': {
    title: 'Inline substitution changes the remaining reference',
    alt: 'Ordinary and inline theme definitions generate different variable references. In an identical plum section, the ordinary token stays blue while the inline class reads the local plum variable.',
    caption: 'Both examples use bg-brand in the same markup. The ordinary token inherits a value resolved at the root; inline makes the generated declaration read --app-brand on the styled element.',
    labels: {
      ordinary: '@theme', inline: '@theme inline', property: 'background-color:',
      ordinaryValue: 'var(--color-brand)', inlineValue: 'var(--app-brand)',
      root: ':root', rootValue: '--app-brand: #1d4ed8',
      resolved: '--color-brand: #1d4ed8', omitted: 'No --color-brand declaration',
      region: '[data-theme="plum"]', regionValue: '--app-brand: #86198f',
      sample: 'bg-brand', blue: 'Inherited blue', plum: 'Local plum',
      invariant: 'Same markup; scope labels show computed values.'
    },
    description: [
      'Both configurations define --color-brand: var(--app-brand). The root defines --app-brand as #1d4ed8, and a nested section overrides it to #86198f.',
      'With ordinary @theme, bg-brand emits background-color: var(--color-brand). The root computes --color-brand as blue; the nested consumer inherits that computed value.',
      'With @theme inline, bg-brand emits background-color: var(--app-brand). The consuming element reads the plum value inherited from its section.',
      'The swatches show the resulting backgrounds. Root values in the drawing are computed values, not a claim that the compiler evaluates colors.'
    ]
  },
  'nested-conditions': {
    title: 'Both queries enclose the same declaration',
    alt: 'A media query encloses a supports query, which encloses the grid rule. The two class suffixes map to these nested CSS boundaries.',
    caption: 'The first query is outermost. The display declaration participates in the cascade only when both conditions match; nesting is not an execution timeline.',
    labels: {
      source: 'One class, two conditions',
      media: '@media(width>=40rem)', supports: '@supports(display:grid)',
      mediaLabel: 'Viewport width', mediaDetail: 'At least 40rem',
      supportsLabel: 'Feature support', supportsDetail: 'display: grid is supported',
      output: 'Generated CSS inside @layer utilities',
      mediaRule: '@media (width>=40rem) {', supportsRule: '@supports (display:grid) {',
      selector: '.grid\\@media\\(width\\>\\=40rem\\)\\@supports\\(display\\:grid\\) {',
      declaration: 'display: grid;'
    },
    description: [
      'grid@media(width>=40rem)@supports(display:grid) emits a grid rule inside @supports (display:grid), itself inside @media (width>=40rem).',
      'The media query tests viewport width; the supports query tests browser support for display: grid. Both must match for this declaration to participate in the cascade.',
      'The generated selector matches the element carrying the complete class. The surrounding utilities layer is omitted from the drawing and retained in the generated CSS example.'
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
