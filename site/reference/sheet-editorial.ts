/**
 * Reading content for structured Reference sheets. Values, families, definitions
 * and generated CSS still come from the preset; this file chooses pages, groups and examples.
 */
export interface SheetExampleSource {
  /** Complete preview markup. The displayed source keeps only the page's own classes. */
  html: string
  /** One short sentence placed before the example; backticks mark code. */
  lead?: string
}

export interface TokenGroupEditorial {
  namespace: string
  /** Group heading when a page holds several groups. */
  title?: string
  /** Placeholder in class patterns, such as `<size>`. */
  placeholder?: string
  /** Family prefix whose classes name the value rows. */
  prefix?: string
  /** Narrow a namespace to part of its tokens, such as the numbered palette. */
  keys?: 'palette' | 'aliases' | 'other'
  /** Present the values as a hue × step matrix instead of a table. */
  palette?: boolean
}

export interface TokenPageEditorial {
  /** URL slug under `/reference/tokens/`. */
  id: string
  title: string
  summary: string
  groups: TokenGroupEditorial[]
  /** Families listed first in Classes; the rest stay one disclosure away. Omit to list every family. */
  primary?: string[]
  /** Replace a family's declarations, for recipes whose definition reads companions. */
  declarations?: Record<string, string>
  /** A Master-specific rule a reader needs before using the classes; backticks mark code. */
  note?: string
  /** Preview several values in one quiet, realistic composition. */
  usage: SheetExampleSource
  customize: SheetExampleSource & { theme: string }
  guide: { label: string, href: string }
}

export interface RecipePageEditorial {
  id: string
  title: string
  summary: string
  /** Preset utility names documented on the page, in reading order. */
  names: string[]
  /** Names listed first in Classes; the rest stay one disclosure away. */
  primary?: string[]
  note?: string
  usage: SheetExampleSource
  /** Practical constraint shown under the preview. */
  caption?: string
  guide?: { label: string, href: string }
}

const article = 'Good interfaces make space for the details: a short preview helps readers decide what to explore next while a clear link keeps the complete story within reach, so the summary works as an invitation and the full article carries everything else.'

/** Reading order of the token pages; Token families and Breakpoints have their own views. */
export const tokenPages: TokenPageEditorial[] = [
  {
    id: 'color',
    title: 'Color',
    summary: 'The preset palette: every hue in numbered steps, plus hue aliases.',
    groups: [
      { namespace: 'color', keys: 'palette', title: 'Palette', palette: true, prefix: 'bg' },
      { namespace: 'color', keys: 'aliases', title: 'Hue aliases', prefix: 'bg' },
      { namespace: 'color', keys: 'other', title: 'Other colors', prefix: 'bg' },
    ],
    primary: ['bg', 'fg', 'b'],
    usage: {
      lead: 'Pair a light step for the fill with a dark step of the same hue for the text.',
      html: '<div class="flex flex-wrap gap-xs">\n  <span class="px-xs py-3xs r-sm bg-green-5 fg-green-70 text-xs">Paid</span>\n  <span class="px-xs py-3xs r-sm bg-amber-5 fg-amber-80 text-xs">Pending</span>\n  <span class="px-xs py-3xs r-sm bg-red-5 fg-red-70 text-xs">Overdue</span>\n  <span class="px-xs py-3xs r-sm bg-blue-5 fg-blue-70 text-xs">Draft</span>\n</div>',
    },
    customize: {
      lead: 'Change a preset value or add a color: `--color-brand` creates `bg-brand`, `fg-brand` and every other color class.',
      theme: '@theme {\n  --color-brand: oklch(56% .2 262);\n}',
      html: '<button class="bg-brand">…</button>',
    },
    guide: { label: 'Color', href: '/guide/colors' },
  },
  {
    id: 'color-roles',
    title: 'Color roles',
    summary: 'Text, surface and line roles with one value for light and one for dark.',
    groups: [
      { namespace: 'color-text', title: 'Text', prefix: 'fg' },
      { namespace: 'color-surface', title: 'Surface', prefix: 'bg' },
      { namespace: 'color-line', title: 'Line', prefix: 'b' },
    ],
    primary: ['fg', 'bg', 'b'],
    note: 'A role is part of the color name, so every color family accepts every role, such as `bg-text-link` or `outline-line-control`. On the base and inset surfaces, `fg-text-body`, `fg-text-strong` and `fg-text-muted` keep at least 4.5:1 contrast in both schemes, and `b-line-control` keeps at least 3:1; `line-divider` and `line-subtle` are decorative.',
    usage: {
      lead: 'Build a card from roles: a raised surface, a divider line, and strong, body and muted text.',
      html: '<article class="p-lg r-xl b(1) b-solid b-line-divider bg-surface-raised">\n  <h3 class="m(0) text-lg font-regular fg-text-strong">Make space for ideas</h3>\n  <p class="mt-xs mb(0) text-sm fg-text-body">A steady rhythm keeps the focus on the content.</p>\n  <p class="mt-md mb(0) pt-sm bt(1) bt-solid bt-line-divider text-xs fg-text-muted">4 min read</p>\n</article>',
    },
    customize: {
      lead: 'Add a role with one value per color scheme: `--color-text-brand` creates `fg-text-brand`.',
      theme: '@theme {\n  --color-text-brand: light-dark(\n    var(--color-indigo-60),\n    var(--color-indigo-30)\n  );\n}',
      html: '<p class="fg-text-brand">…</p>',
    },
    guide: { label: 'Color', href: '/guide/colors#choose-a-color-token' },
  },
  {
    id: 'spacing',
    title: 'Spacing',
    summary: 'One spacing scale for padding, margin, gaps, insets and offsets.',
    groups: [{ namespace: 'spacing', prefix: 'p' }],
    primary: ['p', 'm', 'gap'],
    usage: {
      lead: 'Pad a form, space its fields and separate each label from its control.',
      html: '<form class="grid gap-md p-lg r-xl b(1) b-solid b-line-divider bg-surface-raised">\n  <label class="grid gap-2xs text-sm fg-text-body">Name<input class="px-sm py-xs r-lg b(1) b-solid b-line-control bg-surface-base text-sm" value="Aron" /></label>\n  <label class="grid gap-2xs text-sm fg-text-body">Email<input class="px-sm py-xs r-lg b(1) b-solid b-line-control bg-surface-base text-sm" value="aron@example.com" /></label>\n</form>',
    },
    customize: {
      lead: 'Change a preset value or add a token: `--spacing-card` creates `p-card`, `m-card`, `gap-card` and the other spacing classes.',
      theme: '@theme {\n  --spacing-card: 1.25rem;\n}',
      html: '<div class="p-card">…</div>',
    },
    guide: { label: 'Layout', href: '/guide/layout-system#namespace-for-spacing' },
  },
  {
    id: 'container',
    title: 'Container sizes',
    summary: 'Width caps for max-width, width and the other size classes.',
    groups: [{ namespace: 'container', prefix: 'max-w' }],
    primary: ['max-w', 'w'],
    note: 'Container tokens set lengths only. Changing `--container-md` does not change a container query threshold such as `@container(width>=28rem)`. Full and intrinsic sizes such as `w-full`, `max-w-fit` and `basis-min` are fixed utilities, not container tokens.',
    usage: {
      lead: 'Cap a dialog and the measure of its text.',
      html: '<div class="max-w-xs mx-auto p-lg r-xl b(1) b-solid b-line-divider bg-surface-floating shadow-lg">\n  <p class="m(0) fg-text-strong">Leave this page?</p>\n  <p class="mt-xs mb(0) max-w-3xs text-sm fg-text-muted">Changes you made will not be saved.</p>\n</div>',
    },
    customize: {
      lead: 'Change a preset value or add a size: `--container-prose` creates `max-w-prose`, `w-prose` and the other size classes.',
      theme: '@theme {\n  --container-prose: 40rem;\n}',
      html: '<article class="max-w-prose">…</article>',
    },
    guide: { label: 'Layout', href: '/guide/layout-system#use-container-tokens' },
  },
  {
    id: 'radius',
    title: 'Radius',
    summary: 'The preset corner radius scale, for whole elements or single corners.',
    groups: [{ namespace: 'radius', prefix: 'r' }],
    note: 'Fully rounded corners use the fixed `pill` utility, not a radius token: it sets only `border-radius: calc(infinity * 1px)`.',
    usage: {
      lead: 'Step the radius down from a sheet to the thumbnail inside it.',
      html: '<div class="flex items-center gap-md p-md r-2xl b(1) b-solid b-line-divider bg-surface-raised shadow-xs">\n  <div class="shrink(0) flex items-center justify-center w(56) h(56) r-lg bg-line-subtle text-sm fg-text-muted">FN</div>\n  <div class="grow(1) min-w(0)">\n    <p class="m(0) fg-text-strong">Field notes</p>\n    <p class="mt-3xs mb(0) text-sm fg-text-muted">Every Friday</p>\n  </div>\n  <button class="shrink(0) px-md py-xs pill b(0) bg-surface-inverse fg-text-inverse text-sm">Subscribe</button>\n</div>',
    },
    customize: {
      lead: 'Change a preset value or add a token: `--radius-card` creates `r-card` and each single-corner class.',
      theme: '@theme {\n  --radius-md: .5rem;\n  --radius-card: 1.25rem;\n}',
      html: '<div class="r-card">…</div>',
    },
    guide: { label: 'Color', href: '/guide/colors#raised-surfaces' },
  },
  {
    id: 'shadow',
    title: 'Shadow',
    summary: 'Layered elevation shadows, tuned for light and dark.',
    groups: [{ namespace: 'shadow', prefix: 'shadow' }],
    usage: {
      lead: 'Keep resting surfaces low and lift only what floats above them.',
      html: '<div class="grid grid-cols(2) gap-xl items-start">\n  <article class="p-md r-xl bg-surface-raised shadow-xs">\n    <p class="m(0) fg-text-strong">Card</p>\n    <p class="mt-3xs mb(0) text-sm fg-text-muted">On the page</p>\n  </article>\n  <ul class="m(0) p-3xs r-xl bg-surface-floating shadow-lg (list-style:none)">\n    <li class="px-sm py-2xs r-lg bg-line-subtle text-sm fg-text-strong">Duplicate</li>\n    <li class="px-sm py-2xs text-sm fg-text-body">Rename</li>\n    <li class="px-sm py-2xs text-sm fg-text-body">Archive</li>\n  </ul>\n</div>',
    },
    customize: {
      lead: 'Change a preset value or add a token: `--shadow-card` creates `shadow-card`.',
      theme: '@theme {\n  --shadow-card:\n    0 1px 2px light-dark(oklch(0% 0 none / .08), oklch(0% 0 none / .4)),\n    0 12px 24px -12px light-dark(oklch(0% 0 none / .2), oklch(0% 0 none / .5));\n}',
      html: '<article class="shadow-card">…</article>',
    },
    guide: { label: 'Color', href: '/guide/colors#raised-surfaces' },
  },
  {
    id: 'font',
    title: 'Font',
    summary: 'Font families, sizes and weights, all written as font-*.',
    groups: [
      { namespace: 'font-family', title: 'Family', placeholder: 'family', prefix: 'font' },
      { namespace: 'font-size', title: 'Size', placeholder: 'size', prefix: 'font' },
      { namespace: 'font-weight', title: 'Weight', placeholder: 'weight', prefix: 'font' },
    ],
    note: 'The three namespaces share the `font-` prefix, so a name must be unique among them. A name defined in more than one reports `AMBIGUOUS_TOKEN` and generates no CSS.',
    usage: {
      lead: 'Set a heading in a larger size and medium weight, and a code sample in the mono family.',
      html: '<h3 class="m(0) font-2xl font-medium fg-text-strong">Release notes</h3>\n<p class="mt-xs mb(0) font-sm fg-text-muted">Install the new version with <code class="font-mono font-xs fg-text-body">npm i @master/css</code>.</p>',
    },
    customize: {
      lead: 'Each namespace takes its own tokens: `--font-family-display` creates `font-display`, and `--font-size-hero` creates `font-hero`.',
      theme: '@theme {\n  --font-family-display: "Inter Display", var(--font-family-sans);\n  --font-size-hero: 4rem;\n}',
      html: '<h1 class="font-display font-hero">…</h1>',
    },
    guide: { label: 'Typography', href: '/guide/typography' },
  },
  {
    id: 'text',
    title: 'Text',
    summary: 'Text treatments that set font size, line height and letter spacing together.',
    groups: [{ namespace: 'text', prefix: 'text' }],
    declarations: { text: 'font-size: var(--text-<name>);\nline-height: var(--text-<name>--line-height, normal);\nletter-spacing: var(--text-<name>--letter-spacing, normal);' },
    note: 'A primary `--text-<name>` token creates the class; its `--line-height` and `--letter-spacing` companions are optional and fall back to `normal`. Family, weight and color stay separate classes.',
    usage: {
      lead: 'Give each line of a composition its treatment.',
      html: '<p class="m(0) text-xs uppercase tracking-widest fg-text-muted">Field notes</p>\n<h3 class="mt-xs mb(0) text-3xl font-regular fg-text-strong">Make room for the details</h3>\n<p class="mt-sm mb(0) text-md fg-text-body">A thoughtful hierarchy brings the main idea forward and gives the rest a comfortable rhythm.</p>',
    },
    customize: {
      lead: 'Add a treatment with its companions: `--text-display` creates `text-display`.',
      theme: '@theme {\n  --text-display: 3.5rem;\n  --text-display--line-height: 1.1;\n  --text-display--letter-spacing: -.03em;\n}',
      html: '<h1 class="text-display">…</h1>',
    },
    guide: { label: 'Typography', href: '/guide/typography' },
  },
  {
    id: 'leading',
    title: 'Leading',
    summary: 'Unitless line heights that scale with the font size.',
    groups: [{ namespace: 'leading', prefix: 'leading' }],
    usage: {
      lead: 'Keep a heading compact and give the paragraph below it room.',
      html: '<h3 class="m(0) max-w-3xs text-2xl font-regular leading-xs fg-text-strong">Make space for the details</h3>\n<p class="mt-sm mb(0) max-w-xs text-sm leading-lg fg-text-muted">A comfortable line height helps the eye find the next line, so longer passages stay easy to read.</p>',
    },
    customize: {
      lead: 'Change a preset value or add a token: `--leading-prose` creates `leading-prose`.',
      theme: '@theme {\n  --leading-prose: 1.7;\n}',
      html: '<p class="leading-prose">…</p>',
    },
    guide: { label: 'Typography', href: '/guide/typography#without-vs-with-text-token' },
  },
  {
    id: 'tracking',
    title: 'Tracking',
    summary: 'The preset letter-spacing scale.',
    groups: [{ namespace: 'tracking', prefix: 'tracking' }],
    usage: {
      lead: 'Tighten display headings and open up small uppercase labels.',
      html: '<p class="m(0) text-xs uppercase tracking-widest fg-text-muted">Field notes</p>\n<h3 class="mt-sm mb(0) text-4xl font-regular tracking-tighter fg-text-strong">Make space for ideas</h3>\n<p class="mt-md mb(0) (max-width:34ch) fg-text-muted">A tight heading reads as one shape, while an open label stays legible at small sizes.</p>',
    },
    customize: {
      lead: 'Change a preset value or add a token: `--tracking-display` creates `tracking-display`.',
      theme: '@theme {\n  --tracking-tight: -.03em;\n  --tracking-display: -.05em;\n}',
      html: '<h1 class="tracking-display">…</h1>',
    },
    guide: { label: 'Typography', href: '/guide/typography#without-vs-with-text-token' },
  },
  {
    id: 'motion',
    title: 'Motion',
    summary: 'Animations, durations and easing curves for animation-* and transition-*.',
    groups: [
      { namespace: 'animate', title: 'Animations', placeholder: 'animation', prefix: 'animate' },
      { namespace: 'duration', title: 'Durations', placeholder: 'duration', prefix: 'transition' },
      { namespace: 'easing', title: 'Easing', placeholder: 'easing', prefix: 'transition' },
    ],
    note: 'Durations and easing share the `animation-` and `transition-` prefixes, so their names stay distinct. Each `--animate-*` token is a complete `animation` shorthand; `animate-<name>` emits `animation: var(--animate-<name>)` and retains the keyframes it names. With the same conditions, `animation-*` longhand classes sort before `animate-*`, so the shorthand resets them: override with a native declaration such as `(animation-duration:var(--duration-fast))`. Preset `animate-*` tokens repeat infinitely; add `(animation-iteration-count:1)` or define a custom token for a single run, and pair the class with `@motion-safe`.',
    usage: {
      lead: 'Pulse a live marker only when motion is allowed, and ease a hover change.',
      html: '<div class="flex items-center gap-md">\n  <span class="relative flex w(10) h(10)">\n    <span class="absolute (inset:0) pill bg-green-40 (opacity:.6) animate-ping@motion-safe"></span>\n    <span class="relative w(10) h(10) pill bg-green-50"></span>\n  </span>\n  <button class="px-md py-xs pill b(1) b-solid b-line-control bg-surface-raised text-sm fg-text-strong (transition-property:background-color) transition-fast transition-smooth bg-surface-inset:hover">Live preview</button>\n</div>',
    },
    customize: {
      lead: 'Compose an animation from duration and easing tokens, and declare its keyframes in native CSS: `--animate-reveal` creates `animate-reveal`.',
      theme: '@theme {\n  --animate-reveal:\n    reveal var(--duration-slow) var(--easing-crisp) both;\n}\n\n@keyframes reveal {\n  from { opacity: 0; translate: 0 .5rem; }\n}',
      html: '<section class="animate-reveal@motion-safe">…</section>',
    },
    guide: { label: 'Theme tokens', href: '/guide/theme#define-motion-tokens' },
  },
]

export const recipePages: RecipePageEditorial[] = [
  {
    id: 'grid-tracks',
    title: 'Grid tracks',
    summary: 'Equal grid tracks and spans in one class.',
    names: ['grid-cols', 'grid-rows', 'grid-col-span', 'grid-row-span'],
    note: '`grid-cols()` and `grid-rows()` create the grid; the span functions place an item inside an existing grid.',
    usage: {
      lead: 'Lay out three equal columns and let a feature span two columns and two rows.',
      html: '<div class="grid-cols(3) gap-xs">\n  <div class="grid-col-span(2) grid-row-span(2) flex items-end min-h(120) p-sm r-lg bg-line-subtle text-sm fg-text-strong">Feature</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Notes</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Drafts</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Archive</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Shared</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Trash</div>\n</div>',
    },
    guide: { label: 'Layout', href: '/guide/layout-system#build-column-grids' },
  },
  {
    id: 'truncation',
    title: 'Truncation',
    summary: 'Clip text to one line or a number of lines and end it with an ellipsis.',
    names: ['truncate', 'clamp-lines'],
    note: 'Both need a constrained width. Inside a flex or grid item, give that item `min-w(0)` so it can shrink.',
    usage: {
      lead: 'Keep a file name on one line and its summary to two.',
      html: `<article class="max-w-3xs mx-auto p-md r-xl b(1) b-solid b-line-divider bg-surface-raised">\n  <p class="m(0) text-sm fg-text-strong truncate">field-notes-autumn-collection-final-v03.fig</p>\n  <p class="mt-2xs mb(0) text-sm fg-text-muted clamp-lines(2)">${article}</p>\n</article>`,
    },
    guide: { label: 'Typography', href: '/guide/typography' },
  },
  {
    id: 'sr-only',
    title: 'Screen reader text',
    summary: 'Hide text visually while keeping it in the accessibility tree.',
    names: ['sr-only'],
    usage: {
      lead: 'Name an icon-only button for assistive technology.',
      html: '<button class="flex items-center justify-center w(40) h(40) pill b(1) b-solid b-line-control bg-surface-raised text-lg fg-text-strong">\n  <span aria-hidden="true">+</span>\n  <span class="sr-only">Add collection</span>\n</button>',
    },
    caption: 'The button reads as “Add collection”; the plus sign is hidden from assistive technology.',
  },
  {
    id: 'direct-values',
    title: 'Direct values',
    summary: 'Pass one static number to a length or numeric property.',
    names: ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'mxs', 'mxe', 'my', 'mys', 'mye', 'p', 'pt', 'pr', 'pb', 'pl', 'px', 'pxs', 'pxe', 'py', 'pys', 'pye', 'scroll-m', 'scroll-mt', 'scroll-mr', 'scroll-mb', 'scroll-ml', 'scroll-mx', 'scroll-mxs', 'scroll-mxe', 'scroll-my', 'scroll-mys', 'scroll-mye', 'scroll-p', 'scroll-pt', 'scroll-pr', 'scroll-pb', 'scroll-pl', 'scroll-px', 'scroll-pxs', 'scroll-pxe', 'scroll-py', 'scroll-pys', 'scroll-pye', 'top', 'right', 'bottom', 'left', 'inset', 'ix', 'ixs', 'ixe', 'iy', 'iys', 'iye', 'gap', 'col-gap', 'row-gap', 'border-spacing', 'outline-offset', 'shape-margin', 'translate', 'word-spacing', 'w', 'h', 'size-x', 'size-y', 'min-w', 'min-h', 'min-size-x', 'min-size-y', 'max-w', 'max-h', 'max-size-x', 'max-size-y', 'basis', 'r', 'rtl', 'rtr', 'rbl', 'rbr', 'rss', 'rse', 'res', 'ree', 'b', 'bt', 'br', 'bb', 'bl', 'bx', 'bxs', 'bxe', 'by', 'bys', 'bye', 'outline', 'grow', 'shrink', 'order'],
    primary: ['m', 'p', 'gap', 'w', 'h', 'r', 'b', 'grow', 'shrink', 'order'],
    note: 'Length functions multiply the number by `1px`; `grow()`, `shrink()` and `order()` pass it through. Write a native declaration such as `(margin:1rem)` for other units or dynamic values.',
    usage: {
      lead: 'Set exact pixel lengths and let one box take the remaining space.',
      html: '<div class="flex gap(12) items-stretch">\n  <div class="p(12) r(10) b(1) b-solid b-line-divider bg-surface-raised text-sm fg-text-body">Fixed</div>\n  <div class="grow(1) p(12) r(10) b(1) b-dashed b-line-control text-sm fg-text-muted">Grows to fill</div>\n</div>',
    },
  },
]
