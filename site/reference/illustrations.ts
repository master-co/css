import { referenceText as text, referenceEditorial } from './copy'
import { studyIllustrations } from './study-illustrations'
import { toolIllustrations } from './tool-illustrations'
import { directiveIllustrations } from './directive-illustrations'

/** Shared evidence for authored Reference figures and their portable text. */
export const referenceIllustrations = {
  ...studyIllustrations,
  ...directiveIllustrations,
  ...toolIllustrations,
  'grid-track-flow': {
    title: text("illustrations/grid-track-flow", "title"),
    alt: text("illustrations/grid-track-flow", "alt"),
    caption: text("illustrations/grid-track-flow", "caption"),
    labels: { shared: 'Same children: 1 → 2 → 3 → 4 → 5 → 6', left: 'grid-cols(3)', right: 'grid-rows(3)', leftFlow: 'Row flow · default', rightFlow: 'Column flow · set by the recipe', scope: 'Track count belongs to the parent; a span belongs to an item.' },
    description: [
      text("illustrations/grid-track-flow", "description-0"),
      text("illustrations/grid-track-flow", "description-1"),
      text("illustrations/grid-track-flow", "description-2"),
      text("illustrations/grid-track-flow", "description-3")
    ]
  },
  'truncation-lines': {
    title: text("illustrations/truncation-lines", "title"),
    alt: text("illustrations/truncation-lines", "alt"),
    caption: text("illustrations/truncation-lines", "caption"),
    labels: { headings: ['Full text', 'truncate', 'clamp-lines(2)'], content: 'Good interfaces keep the full story within reach. A short preview helps readers decide what to explore next.', scope: 'Visual clipping does not shorten the DOM text or provide a way to expand it.' },
    description: [
      text("illustrations/truncation-lines", "description-0"),
      text("illustrations/truncation-lines", "description-1"),
      text("illustrations/truncation-lines", "description-2"),
      text("illustrations/truncation-lines", "description-3")
    ]
  },
  'screen-reader-name': {
    title: text("illustrations/screen-reader-name", "title"),
    alt: text("illustrations/screen-reader-name", "alt"),
    caption: text("illustrations/screen-reader-name", "caption"),
    labels: { source: 'One link', visual: 'Visual rendering', accessible: 'Accessible representation', open: '<a href="#customize">', icon: '<span aria-hidden="true">↓</span>', clipped: '<span class="sr-only">', name: 'Read the utility definition', closeSpan: '</span>', close: '</a>', role: 'link', scope: 'Hide the label’s paint; keep the control and its name available.' },
    description: [
      text("illustrations/screen-reader-name", "description-0"),
      text("illustrations/screen-reader-name", "description-1"),
      text("illustrations/screen-reader-name", "description-2"),
      text("illustrations/screen-reader-name", "description-3")
    ]
  },
  'direct-number-units': {
    title: text("illustrations/direct-number-units", "title"),
    alt: text("illustrations/direct-number-units", "alt"),
    caption: text("illustrations/direct-number-units", "caption"),
    labels: { left: 'p(12)', leftOutput: 'padding: calc(12 * 1px)', content: 'Content', inset: '12px', right: 'grow(1) / grow(2)', rightOutput: 'Unitless growth factors', basis: 'Zero basis · no content minimum', scope: 'A direct number is not a theme-scale step.' },
    description: [
      text("illustrations/direct-number-units", "description-0"),
      text("illustrations/direct-number-units", "description-1"),
      text("illustrations/direct-number-units", "description-2"),
      text("illustrations/direct-number-units", "description-3")
    ]
  },
  'motion-duration-override': {
    title: text("illustrations/motion-duration-override", "title"),
    alt: text("illustrations/motion-duration-override", "alt"),
    caption: text("illustrations/motion-duration-override", "caption"),
    labels: {
      first: 'animate-pulse',
      second: 'animate-pulse animation-slow',
      firstResult: 'Preset shorthand: 1000ms', secondResult: 'Duration override: 300ms',
      start: '0ms', middle: '300ms', end: '1000ms',
      scope: 'Same conditions · same keyframes · one shared time scale'
    },
    description: [
      text("illustrations/motion-duration-override", "description-0"),
      text("illustrations/motion-duration-override", "description-1"),
      text("illustrations/motion-duration-override", "description-2"),
      text("illustrations/motion-duration-override", "description-3")
    ]
  },
  'font-properties': {
    title: text("illustrations/font-properties", "title"),
    alt: text("illustrations/font-properties", "alt"),
    caption: text("illustrations/font-properties", "caption"),
    labels: {
      baseline: 'font-sans font-2xl font-regular', heading: 'Common baseline',
      headings: ['Changed class', 'Baseline', 'Result'], sample: 'Field notes',
      rows: [
        { class: 'font-serif', classes: 'font-serif font-2xl font-regular' },
        { class: 'font-4xl', classes: 'font-sans font-4xl font-regular' },
        { class: 'font-semibold', classes: 'font-sans font-2xl font-semibold' }
      ],
      scope: 'Family, size and weight remain independent; the shared prefix does not combine them.'
    },
    description: [
      text("illustrations/font-properties", "description-0"),
      text("illustrations/font-properties", "description-1"),
      text("illustrations/font-properties", "description-2"),
      text("illustrations/font-properties", "description-3")
    ]
  },
  'text-companions': {
    title: text("illustrations/text-companions", "title"),
    alt: text("illustrations/text-companions", "alt"),
    caption: text("illustrations/text-companions", "caption"),
    source: '@theme { --text-card: 1.5rem; }',
    labels: {
      class: 'text-card',
      properties: ['font-size:', 'line-height:', 'letter-spacing:'],
      values: ['var(--text-card)', 'var(--text-card--line-height, normal)', 'var(--text-card--letter-spacing, normal)'],
      scope: 'Missing companions use normal; they do not preserve inherited values.'
    },
    description: [
      text("illustrations/text-companions", "description-0"),
      text("illustrations/text-companions", "description-1"),
      text("illustrations/text-companions", "description-2"),
      text("illustrations/text-companions", "description-3")
    ]
  },
  'leading-ratio': {
    title: text("illustrations/leading-ratio", "title"),
    alt: text("illustrations/leading-ratio", "alt"),
    caption: text("illustrations/leading-ratio", "caption"),
    labels: {
      parent: 'Parent: leading-md', ratio: 'line-height: 1.6',
      classes: ['font-md', 'font-2xl'], sizes: ['font-md · 16px', 'font-2xl · 24px'],
      lines: ['Read this line', 'Then the next', 'And one more'],
      results: ['16px × 1.6 = 25.6px', '24px × 1.6 = 38.4px'],
      scope: 'The ratio is inherited; each child supplies its own font size.'
    },
    description: [
      text("illustrations/leading-ratio", "description-0"),
      text("illustrations/leading-ratio", "description-1"),
      text("illustrations/leading-ratio", "description-2"),
      text("illustrations/leading-ratio", "description-3")
    ]
  },
  'tracking-inheritance': {
    title: text("illustrations/tracking-inheritance", "title"),
    alt: text("illustrations/tracking-inheritance", "alt"),
    caption: text("illustrations/tracking-inheritance", "caption"),
    labels: {
      parent: 'Parent: font-md tracking-widest', computed: '.12 × 16px = 1.92px',
      classes: ['font-3xl', 'font-3xl tracking-widest'], sample: 'Letterforms',
      results: ['Inherited: 1.92px', 'Reapplied: 3.84px'],
      scope: 'Guides span the text boxes; font size and glyph shapes stay the same.'
    },
    description: [
      text("illustrations/tracking-inheritance", "description-0"),
      text("illustrations/tracking-inheritance", "description-1"),
      text("illustrations/tracking-inheritance", "description-2"),
      text("illustrations/tracking-inheritance", "description-3")
    ]
  },
  'radius-clipping': {
    title: text("illustrations/radius-clipping", "title"),
    alt: text("illustrations/radius-clipping", "alt"),
    caption: text("illustrations/radius-clipping", "caption"),
    labels: {
      shared: 'Same parent radius · same child', left: 'r-4xl', right: 'r-4xl overflow-hidden',
      child: 'Child surface', parent: 'Parent content',
      visible: 'The child still paints square corners', clipped: 'The parent clips the child’s paint',
      scope: 'Rounding sets the shape; overflow decides whether descendants are clipped.'
    },
    description: [
      text("illustrations/radius-clipping", "description-0"),
      text("illustrations/radius-clipping", "description-1"),
      text("illustrations/radius-clipping", "description-2"),
      text("illustrations/radius-clipping", "description-3")
    ]
  },
  'shadow-footprint': {
    title: text("illustrations/shadow-footprint", "title"),
    alt: text("illustrations/shadow-footprint", "alt"),
    caption: text("illustrations/shadow-footprint", "caption"),
    labels: {
      left: 'shadow-xs', right: 'shadow-xl', title: text("illustrations/shadow-footprint", "labels-title"), content: 'Content stays in flow',
      next: 'Next element', gap: '16px',
      shared: 'Same box · same content · same gap',
      scope: 'A larger painted footprint does not move the next element.'
    },
    description: [
      text("illustrations/shadow-footprint", "description-0"),
      text("illustrations/shadow-footprint", "description-1"),
      text("illustrations/shadow-footprint", "description-2"),
      text("illustrations/shadow-footprint", "description-3")
    ]
  },
  'spacing-boundaries': {
    title: text("illustrations/spacing-boundaries", "title"),
    alt: text("illustrations/spacing-boundaries", "alt"),
    caption: text("illustrations/spacing-boundaries", "caption"),
    labels: {
      token: '--spacing-md: 1rem', padding: 'grid p-md', gap: 'grid gap-md',
      first: 'First row of content', second: 'Next row of content',
      inside: '1rem inside the box', between: '1rem between rows',
      distinction: 'Gap adds no space before the first item or after the last.'
    },
    description: [
      text("illustrations/spacing-boundaries", "description-0"),
      text("illustrations/spacing-boundaries", "description-1"),
      text("illustrations/spacing-boundaries", "description-2"),
      text("illustrations/spacing-boundaries", "description-3")
    ]
  },
  'container-cap': {
    title: text("illustrations/container-cap", "title"),
    alt: text("illustrations/container-cap", "alt"),
    caption: text("illustrations/container-cap", "caption"),
    labels: {
      class: 'max-w-3xs', declaration: 'max-width: var(--container-3xs)',
      wide: '20rem available', narrow: '13rem available',
      capped: '16rem', fitted: '13rem', content: 'Content',
      scope: 'Normal block layout · auto width · border-box · no minimum width'
    },
    widths: { wide: 320, narrow: 208 },
    description: [
      text("illustrations/container-cap", "description-0"),
      text("illustrations/container-cap", "description-1"),
      text("illustrations/container-cap", "description-2"),
      text("illustrations/container-cap", "description-3")
    ]
  },
  'hue-alias-selection': {
    title: text("illustrations/hue-alias-selection", "title"),
    alt: text("illustrations/hue-alias-selection", "alt"),
    caption: text("illustrations/hue-alias-selection", "caption"),
    labels: {
      heading: 'An alias selects a particular palette step',
      prefixes: ['bg-', 'bg-'], hues: ['blue', 'yellow'], selected: [60, 40],
      variables: ['--color-blue-60', '--color-yellow-40'],
      steps: ['10', '20', '40', '60', '80', '90'],
      scope: 'Preset references; neither alias switches with the color scheme.'
    },
    description: [
      text("illustrations/hue-alias-selection", "description-0"),
      text("illustrations/hue-alias-selection", "description-1"),
      text("illustrations/hue-alias-selection", "description-2"),
      text("illustrations/hue-alias-selection", "description-3")
    ]
  },
  'role-value-selection': {
    title: text("illustrations/role-value-selection", "title"),
    alt: text("illustrations/role-value-selection", "alt"),
    caption: text("illustrations/role-value-selection", "caption"),
    labels: {
      class: 'fg-text-muted', declaration: 'color: var(--color-text-muted)',
      lightValue: 'var(--color-zinc-60)', darkValue: 'var(--color-zinc-40)',
      light: 'color-scheme: light', dark: 'color-scheme: dark',
      sample: 'Secondary text', surface: 'bg-surface-base',
      selection: 'The browser selects a value; the utility is unchanged.'
    },
    description: [
      text("illustrations/role-value-selection", "description-0"),
      text("illustrations/role-value-selection", "description-1"),
      text("illustrations/role-value-selection", "description-2"),
      text("illustrations/role-value-selection", "description-3")
    ]
  },
  'namespace-lookup': {
    title: text("illustrations/namespace-lookup", "title"),
    alt: text("illustrations/namespace-lookup", "alt"),
    caption: text("illustrations/namespace-lookup", "caption"),
    labels: {
      class: 'Class', token: 'Selected token', property: 'Native property',
      prefixes: ['p-', 'max-w-', 'font-'],
      namespaces: ['--spacing-', '--container-', '--font-size-'],
      properties: ['padding', 'max-width', 'font-size'],
      key: 'md', note: 'Same key · different namespaces',
      qualifier: 'Preset lookup shown; font- also accepts family and weight keys.'
    },
    description: [
      text("illustrations/namespace-lookup", "description-0"),
      text("illustrations/namespace-lookup", "description-1"),
      text("illustrations/namespace-lookup", "description-2"),
      text("illustrations/namespace-lookup", "description-3")
    ]
  },
  'native-value-boundary': {
    title: text("illustrations/native-value-boundary", "title"),
    alt: text("illustrations/native-value-boundary", "alt"),
    caption: text("illustrations/native-value-boundary", "caption"),
    labels: {
      source: 'One HTML class', property: 'Property', value: 'Quoted value', selector: 'Selector',
      propertyDetail: 'Full CSS name', valueDetail: 'A literal ) character', selectorDetail: 'Outside the head',
      output: "content: ')';", result: 'Declaration on ::before'
    },
    description: [
      text("illustrations/native-value-boundary", "description-0"),
      text("illustrations/native-value-boundary", "description-1"),
      text("illustrations/native-value-boundary", "description-2")
    ]
  },
  'condition-domains': {
    title: text("illustrations/condition-domains", "title"),
    alt: text("illustrations/condition-domains", "alt"),
    caption: text("illustrations/condition-domains", "caption"),
    viewportRem: 64, containerRem: 28,
    labels: {
      viewport: 'Viewport', media: '@md', viewportWidth: '64rem',
      container: 'Query container', query: '@container(--md)', containerWidth: '28rem',
      child: 'Queried descendant',
      scale: 'Widths use the same drawing scale; 1rem is assumed to be 16px.',
      units: 'Queries retain their native units.'
    },
    description: [
      text("illustrations/condition-domains", "description-0"),
      text("illustrations/condition-domains", "description-1"),
      text("illustrations/condition-domains", "description-2")
    ]
  },
  'shared-source-class': {
    title: text("illustrations/shared-source-class", "title"),
    alt: text("illustrations/shared-source-class", "alt"),
    caption: text("illustrations/shared-source-class", "caption"),
    labels: {
      removed: 'Removed source', live: 'Still scanned',
      first: 'page-a.tsx', second: 'page-b.tsx', source: 'className="p-md"',
      output: 'The shared utility remains', selector: '.p-md {', declaration: 'padding: var(--spacing-md);',
      dependency: 'Its --spacing-md theme dependency remains too.',
      lifetime: 'Removing the final source or safelist reference releases the class.'
    },
    description: [
      text("illustrations/shared-source-class", "description-0"),
      text("illustrations/shared-source-class", "description-1"),
      text("illustrations/shared-source-class", "description-2"),
      text("illustrations/shared-source-class", "description-3")
    ]
  },
  'layer-precedence': {
    title: text("illustrations/layer-precedence", "title"),
    alt: text("illustrations/layer-precedence", "alt"),
    caption: text("illustrations/layer-precedence", "caption"),
    labels: {
      heading: 'Base order plus unlayered CSS',
      layers: ['theme', 'base', 'defaults', 'components', 'utilities'],
      unlayered: 'Unlayered CSS', normal: 'Normal', important: '!important',
      weaker: 'Weaker', stronger: 'Stronger', direction: 'Arrows point toward higher priority.',
      scope: 'Author stylesheet rules; inline styles, animations and transitions are not shown.'
    },
    description: [
      text("illustrations/layer-precedence", "description-0"),
      text("illustrations/layer-precedence", "description-1"),
      text("illustrations/layer-precedence", "description-2"),
      text("illustrations/layer-precedence", "description-3")
    ]
  },
  'inline-resolution': {
    title: text("illustrations/inline-resolution", "title"),
    alt: text("illustrations/inline-resolution", "alt"),
    caption: text("illustrations/inline-resolution", "caption"),
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
      text("illustrations/inline-resolution", "description-0"),
      text("illustrations/inline-resolution", "description-1"),
      text("illustrations/inline-resolution", "description-2"),
      text("illustrations/inline-resolution", "description-3")
    ]
  },
  'nested-conditions': {
    title: text("illustrations/nested-conditions", "title"),
    alt: text("illustrations/nested-conditions", "alt"),
    caption: text("illustrations/nested-conditions", "caption"),
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
      text("illustrations/nested-conditions", "description-0"),
      text("illustrations/nested-conditions", "description-1"),
      text("illustrations/nested-conditions", "description-2")
    ]
  },
  'selector-targets': {
    title: text("illustrations/selector-targets", "title"),
    alt: text("illustrations/selector-targets", "alt"),
    caption: text("illustrations/selector-targets", "caption"),
    labels: {
      invariant: 'The first link is hovered in both cases',
      ownerClass: 'underline:hover>a', targetClass: 'underline>a:hover',
      ownerTest: 'Test on the article', targetTest: 'Test on each link',
      article: 'Documentation', firstLink: 'Installation and setup', secondLink: 'API reference',
      ownerResult: 'Both links are underlined', targetResult: 'Only the hovered link is underlined'
    },
    description: [
      text("illustrations/selector-targets", "description-0"),
      text("illustrations/selector-targets", "description-1"),
      text("illustrations/selector-targets", "description-2"),
      text("illustrations/selector-targets", "description-3")
    ]
  }
} as const

export type ReferenceIllustrationId = keyof typeof referenceIllustrations

export function referenceFigure(id: string, locale = 'en') {
  const figure = referenceIllustrations[id as ReferenceIllustrationId]
  if (!figure) throw new Error(`Unknown Reference illustration: ${id}`)
  return referenceEditorial(figure, `illustrations/${id}`, locale)
}

export function referenceIllustrationMarkdown(id: string, locale = 'en') {
  const figure = referenceFigure(id, locale)
  if (!figure) throw new Error(`Unknown Reference illustration: ${id}`)
  return `<!-- reference-illustration:${id} -->\n\n**${figure.title}**\n\n${figure.caption}\n\n${figure.description.map(item => `- ${item}`).join('\n')}\n\n<!-- /reference-illustration -->`
}
