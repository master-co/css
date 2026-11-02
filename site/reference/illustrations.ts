import { toolIllustrations } from './tool-illustrations'
import { directiveIllustrations } from './directive-illustrations'

/** Shared evidence for authored Reference figures and their portable text. */
export const referenceIllustrations = {
  ...directiveIllustrations,
  ...toolIllustrations,
  'grid-track-flow': {
    title: 'Column and row recipes fill the same children in different directions',
    alt: 'Six numbered items form three columns and two rows with grid-cols(3). With grid-rows(3), they form three rows and two columns, filling down before starting the next column.',
    caption: 'Both grids use the same six children and gap. grid-rows(3) also sets grid-auto-flow: column; grid-cols(3) leaves the default row flow. Tile heights follow their content.',
    labels: { shared: 'Same children: 1 → 2 → 3 → 4 → 5 → 6', left: 'grid-cols(3)', right: 'grid-rows(3)', leftFlow: 'Row flow · default', rightFlow: 'Column flow · set by the recipe', scope: 'Track count belongs to the parent; a span belongs to an item.' },
    description: [
      'The first grid has three explicit minmax(0, 1fr) columns. Default row flow places items 1, 2 and 3 across its first row, followed by 4, 5 and 6.',
      'The second grid has three explicit minmax(0, 1fr) rows and column auto-flow. Items 1, 2 and 3 fill the first column; 4, 5 and 6 fill the second.',
      'Both scenes use real preset CSS, six identical content-sized tiles and a 12px gap. Widths keep the tile widths comparable; neither recipe supplies that gap or width.',
      'The illustration uses default item placement. Explicit placement and spans can change the result; grid-cols does not reset a column flow established elsewhere.'
    ]
  },
  'truncation-lines': {
    title: 'The same text can paint all lines, one line or two lines',
    alt: 'Three equal-width copies of a paragraph show the full text, a one-line ellipsis using truncate, and a two-line ellipsis using clamp-lines(2). The clipped examples keep the same complete text in the DOM.',
    caption: 'The font, width and text are identical. Only the truncation class changes. The native browser paints the ellipsis; the full string remains available in each element.',
    labels: { headings: ['Full text', 'truncate', 'clamp-lines(2)'], content: 'Good interfaces keep the full story within reach. A short preview helps readers decide what to explore next.', scope: 'Visual clipping does not shorten the DOM text or provide a way to expand it.' },
    description: [
      'Each copy has a 192px width, a 14px font and a 24px line height.',
      'The first copy wraps freely and grows to contain every line. truncate keeps the second on one line and hides the overflow with an ellipsis.',
      'clamp-lines(2) lets the third copy wrap, then limits its visible content to two lines using the prefixed line-clamp combination.',
      'All three elements contain the same full string. A separate disclosure or link is needed when readers must access the complete visible text.'
    ]
  },
  'screen-reader-name': {
    title: 'Clipped text can still name a visible control',
    alt: 'One link contains a visible arrow and sr-only text. Its visual representation shows only the arrow; its accessible representation is a link named Read the utility definition.',
    caption: 'The arrow has aria-hidden="true". The label text is visually clipped by sr-only and supplies the link’s accessible name. The link itself stays visible and focusable.',
    labels: { source: 'One link', visual: 'Visual rendering', accessible: 'Accessible representation', open: '<a href="#customize">', icon: '<span aria-hidden="true">↓</span>', clipped: '<span class="sr-only">', name: 'Read the utility definition', closeSpan: '</span>', close: '</a>', role: 'link', scope: 'Hide the label’s paint; keep the control and its name available.' },
    description: [
      'The link contains an arrow excluded from accessible-name calculation and a span containing Read the utility definition.',
      'The span uses the actual sr-only preset: absolute positioning, a 1px box, hidden overflow and clipping. It remains in the DOM without aria-hidden.',
      'The visible link still occupies a 40px square and shows the arrow. Its accessible role is link and its name is Read the utility definition.',
      'The two branches are representations of the same control, not sequential operations. Hiding an ancestor from the accessibility tree would also hide its descendants.'
    ]
  },
  'direct-number-units': {
    title: 'Direct numbers become pixel lengths or unitless factors',
    alt: 'p(12) produces a 12-pixel inset around a content box. grow(1) and grow(2) divide an equal zero-basis flex row’s free space in a one-to-two ratio.',
    caption: 'The left number becomes a pixel length. The right numbers are flex factors: zero bases and no content minimum isolate their 1:2 distribution. Other bases and minimum sizes can change final widths.',
    labels: { left: 'p(12)', leftOutput: 'padding: calc(12 * 1px)', content: 'Content', inset: '12px', right: 'grow(1) / grow(2)', rightOutput: 'Unitless growth factors', basis: 'Zero basis · no content minimum', scope: 'A direct number is not a theme-scale step.' },
    description: [
      'The padding example applies real p(12), giving exactly 12px between its content and each outer edge. A blue annotation makes that inset visible.',
      'The flex example applies grow(1) and grow(2) to two items with zero flex bases and zero minimum widths, in a 252px row with a 12px gap.',
      'The remaining 240px is distributed as 80px and 160px. The factors remain unitless; they are not pixel widths.',
      'These are controlled comparisons. With nonzero bases or content minimums, the final widths need not match the growth ratio. Each function’s declaration is listed in the article.'
    ]
  },
  'motion-duration-override': {
    title: 'A duration class changes timing while keeping the same keyframes',
    alt: 'Two animations are compared on a shared time scale. animate-pulse alone lasts 1000 milliseconds per iteration; adding animation-slow reduces the duration to 300 milliseconds while keeping the same keyframes.',
    caption: 'Both cases use the same pulse keyframes. Bars measure one iteration’s duration, not animation progress or rendering speed. The preset repeats; the comparison isolates a single iteration.',
    labels: {
      first: 'animate-pulse',
      second: 'animate-pulse animation-slow',
      firstResult: 'Preset shorthand: 1000ms', secondResult: 'Duration override: 300ms',
      start: '0ms', middle: '300ms', end: '1000ms',
      scope: 'Same conditions · same keyframes · one shared time scale'
    },
    description: [
      'The animate-pulse shorthand supplies pulse 1s infinite. Its duration is one second per iteration.',
      'Under the same conditions, animation-slow sorts after animate-pulse and replaces only its duration with var(--duration-slow), or 300ms. The pulse keyframes and infinite iteration count remain the same.',
      'Both horizontal bars start at zero. Their lengths have a 1000:300 ratio on the same millisecond axis. They measure declared duration per iteration, not performance or the distance a shape travels.',
      'The preset pulse token repeats infinitely. Add a native iteration count or define a custom token to run once; changing the order of class names does not change generated rule order.'
    ]
  },
  'font-properties': {
    title: 'The font prefix can change three independent properties',
    alt: 'Three rows compare the same Field notes text with one baseline. A serif class changes the face, a larger size class changes the size, and a semibold class changes the weight.',
    caption: 'Every row starts with font-sans, font-2xl and font-regular. The result replaces only the class for the named property. The available fonts determine the rendered faces.',
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
      'The baseline text uses the sans family, 1.5rem size and weight 400, with a 16px root font size.',
      'The font-serif row changes only font-family. The font-4xl row changes only font-size, to 2.25rem. The font-semibold row changes only font-weight, to 600.',
      'Each result uses the same words. A common unitless line-height of 1.5 keeps the samples readable; these font classes do not set line-height.',
      'The samples render real preset CSS with available system fonts. They do not imply that a family class downloads a font file.'
    ]
  },
  'text-companions': {
    title: 'A text treatment always writes three properties',
    alt: 'A custom text-card class branches to font-size, line-height and letter-spacing. The size reads the primary token; the two absent companions each fall back to normal.',
    caption: 'Only the primary --text-card token is defined here. Both companion declarations still exist and use normal, replacing any inherited line height or letter spacing.',
    source: '@theme { --text-card: 1.5rem; }',
    labels: {
      class: 'text-card',
      properties: ['font-size:', 'line-height:', 'letter-spacing:'],
      values: ['var(--text-card)', 'var(--text-card--line-height, normal)', 'var(--text-card--letter-spacing, normal)'],
      scope: 'Missing companions use normal; they do not preserve inherited values.'
    },
    description: [
      'The custom theme defines --text-card as 1.5rem and defines neither companion.',
      'text-card emits font-size: var(--text-card), line-height: var(--text-card--line-height, normal) and letter-spacing: var(--text-card--letter-spacing, normal).',
      'All three solid branches represent emitted declarations. The absent companions use their normal fallback rather than inheriting another line height or letter spacing.',
      'A companion on its own does not register text-card. Family, weight and color are outside this recipe.'
    ]
  },
  'leading-ratio': {
    title: 'The same inherited ratio produces different line heights',
    alt: 'Two children inherit leading-md, or 1.6. Equal-width columns show three full line boxes: a 16px font produces 25.6px lines; a 24px font produces 38.4px lines.',
    caption: 'The children inherit a unitless 1.6 and use different font sizes. Tinted bands show complete line boxes, not the blank gaps between glyphs. The columns keep the same width.',
    labels: {
      parent: 'Parent: leading-md', ratio: 'line-height: 1.6',
      classes: ['font-md', 'font-2xl'], sizes: ['font-md · 16px', 'font-2xl · 24px'],
      lines: ['Read this line', 'Then the next', 'And one more'],
      results: ['16px × 1.6 = 25.6px', '24px × 1.6 = 38.4px'],
      scope: 'The ratio is inherited; each child supplies its own font size.'
    },
    description: [
      'A common parent uses leading-md, whose preset value is the number 1.6.',
      'The first child uses font-md at a 16px root font size, giving 16px text and a 25.6px line height.',
      'The second child uses font-2xl, giving 24px text and a 38.4px line height. It inherits the same ratio rather than a fixed 25.6px length.',
      'Each column contains the same three lines. Colored bands are inspection annotations of the complete line boxes; they are not padding or gaps generated by leading-md.'
    ]
  },
  'tracking-inheritance': {
    title: 'Reapplying em tracking recalculates its length',
    alt: 'A 16px parent uses tracking-widest. Two 32px children show the same word: one inherits 1.92px tracking, while the other reapplies tracking-widest and uses 3.84px, producing a wider text box.',
    caption: 'Both children have the same font and size. The inherited letter-spacing length stays 1.92px; reapplying the class evaluates .12em at the child’s 32px font size.',
    labels: {
      parent: 'Parent: font-md tracking-widest', computed: '.12 × 16px = 1.92px',
      classes: ['font-3xl', 'font-3xl tracking-widest'], sample: 'Letterforms',
      results: ['Inherited: 1.92px', 'Reapplied: 3.84px'],
      scope: 'Guides span the text boxes; font size and glyph shapes stay the same.'
    },
    description: [
      'The parent uses font-md and tracking-widest. With a 16px root font size, its .12em tracking computes to a 1.92px length.',
      'Both child samples use font-3xl, or 32px, and the same word and font.',
      'The first child inherits the computed 1.92px letter spacing. The second reapplies tracking-widest, so .12em computes against 32px and becomes 3.84px.',
      'The second text box is wider even though the glyph size is unchanged. The colored guides show layout widths, not glyph-ink bounds or borders emitted by tracking.'
    ]
  },
  'radius-clipping': {
    title: 'The parent’s radius does not round its child',
    alt: 'Two identical rounded parents contain the same blue child surface. With radius alone the child keeps square top corners; with overflow-hidden it follows the parent’s curved edge.',
    caption: 'Both parents use r-4xl and the same content. Only the right parent adds overflow-hidden. Blue identifies the child surface; the dashed contour marks the parent’s rounded edge.',
    labels: {
      shared: 'Same parent radius · same child', left: 'r-4xl', right: 'r-4xl overflow-hidden',
      child: 'Child surface', parent: 'Parent content',
      visible: 'The child still paints square corners', clipped: 'The parent clips the child’s paint',
      scope: 'Rounding sets the shape; overflow decides whether descendants are clipped.'
    },
    description: [
      'Both parent boxes use r-4xl, whose preset value is 2rem. They contain identical child and parent-content regions, with dimensions following the same content.',
      'The left parent keeps the default visible overflow. Its own background is rounded, but the blue child paints a rectangle at the top.',
      'The right parent adds overflow-hidden. The same child rectangle is clipped to the parent’s rounded edge; the child does not inherit a radius.',
      'The dashed contour is an inspection annotation, not a border emitted by r-4xl. The color only identifies the same child in both examples.'
    ]
  },
  'shadow-footprint': {
    title: 'Shadow paint does not reserve layout space',
    alt: 'Identical surfaces use shadow-xs and shadow-xl. Their box edges and following elements align at the same heights, while the larger shadow extends farther into the surrounding space.',
    caption: 'The surfaces keep identical geometry and a 16px gap to the next element. Only the shadow token changes. Rulers measure the gap between boxes, not the shadow’s visible edge.',
    labels: {
      left: 'shadow-xs', right: 'shadow-xl', title: 'One surface', content: 'Content stays in flow',
      next: 'Next element', gap: '16px',
      shared: 'Same box · same content · same gap',
      scope: 'A larger painted footprint does not move the next element.'
    },
    description: [
      'Both columns contain the same surface and following element. Their dimensions, padding and 16px layout gap are identical.',
      'The left surface uses the preset shadow-xs token. The right surface uses shadow-xl, which paints more layers over a wider area.',
      'The next element starts at the same height in both columns. Box shadows do not change the dimensions or spacing used by layout.',
      'Both shadows use actual preset values. Their colors adapt to the image’s scheme while their offsets, blur and spread lengths remain unchanged. Gap rulers are inspection annotations.'
    ]
  },
  'spacing-boundaries': {
    title: 'Padding surrounds content; gap separates items',
    alt: 'The same spacing-md token feeds two Grid examples. The padding example highlights a band inside the outer edge. The gap example highlights only the space between two rows.',
    caption: 'Both highlighted distances are 1rem, shown at a 16px root font size. Blue and violet are inspection overlays; p-md and gap-md do not add those colors.',
    labels: {
      token: '--spacing-md: 1rem', padding: 'grid p-md', gap: 'grid gap-md',
      first: 'First row of content', second: 'Next row of content',
      inside: '1rem inside the box', between: '1rem between rows',
      distinction: 'Gap adds no space before the first item or after the last.'
    },
    description: [
      'Both examples use Grid and the preset --spacing-md value of 1rem. Their content rows use the same typography and internal dimensions.',
      'The left example has p-md and no gap. Its blue band lies inside the box edge, surrounding the content on all four sides.',
      'The right example has gap-md and no padding. Its violet band lies only between the two rows, with no matching band around the outside.',
      'At the depicted 16px root font size, each highlighted distance is 16px. The examples use real generated padding and gap; the annotation colors and dashed boundaries are not utility output.'
    ]
  },
  'container-cap': {
    title: 'The same maximum can produce different widths',
    alt: 'Two auto-width blocks share max-w-3xs, a 16rem maximum. In a 20rem parent the block is 16rem wide; in a 13rem parent it fits at 13rem.',
    caption: 'A normal block with auto width fits the available space up to its maximum. The two parent widths are drawn at the same scale, with a 16px root font size.',
    labels: {
      class: 'max-w-3xs', declaration: 'max-width: var(--container-3xs)',
      wide: '20rem available', narrow: '13rem available',
      capped: '16rem', fitted: '13rem', content: 'Content',
      scope: 'Normal block layout · auto width · border-box · no minimum width'
    },
    widths: { wide: 320, narrow: 208 },
    description: [
      'max-w-3xs reads the preset --container-3xs value of 16rem. Both examples have auto width in normal block layout, use border-box sizing and have no minimum-width constraint.',
      'The first parent provides 20rem. The child stops at its 16rem maximum, leaving unused space after it.',
      'The second parent provides 13rem. The child fits that smaller space instead of becoming 16rem wide.',
      'The dashed contour identifies the available width; it is not a generated border or query container. Both parents are drawn at the same scale with a 16px root font size. Heights follow the same content.'
    ]
  },
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
