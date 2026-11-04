import { referenceText as text, referenceEditorial } from './copy'
/**
 * Reading content for structured Reference sheets. Values, families, definitions
 * and generated CSS still come from the preset; this file chooses pages, groups and examples.
 */
import type { ReferenceIllustrationId } from './illustrations'

export interface SheetExampleSource {
  /** Complete preview markup. The displayed source keeps only the page's own classes. */
  html: string
  /** One short sentence placed before the example; backticks mark code. */
  lead?: string
  /** Prerequisites that must stay visible even when other styling is abbreviated. */
  keep?: string[]
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
  /** Explain the lookup's distinctive behavior beside its authored figure. */
  explanation?: { id: string, title: string, paragraphs: string[], illustration: ReferenceIllustrationId, links?: { label: string, href: string }[] }
  valuesLead?: string
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
  explanation?: TokenPageEditorial['explanation']
  usage: SheetExampleSource
  /** Practical constraint shown under the preview. */
  caption?: string
  guide?: { label: string, href: string }
}

const article = 'Good interfaces make space for the details: a short preview helps readers decide what to explore next while a clear link keeps the complete story within reach, so the summary works as an invitation and the full article carries everything else.'

/** Reading order of the token value pages; Token families has its own view. */
export const tokenPages: TokenPageEditorial[] = [
  {
    id: 'color',
    title: text("tokens/color", "title"),
    summary: text("tokens/color", "summary"),
    groups: [
      { namespace: 'color', keys: 'palette', title: text("tokens/color", "groups-0-title"), palette: true, prefix: 'bg' },
      { namespace: 'color', keys: 'aliases', title: text("tokens/color", "groups-1-title"), prefix: 'bg' },
      { namespace: 'color', keys: 'other', title: text("tokens/color", "groups-2-title"), prefix: 'bg' },
    ],
    primary: ['bg', 'fg', 'b'],
    note: text("tokens/color", "note"),
    valuesLead: text("tokens/color", "valuesLead"),
    explanation: {
      id: 'hue-aliases', title: text("tokens/color", "explanation-title"), illustration: 'hue-alias-selection',
      paragraphs: [
        text("tokens/color", "explanation-paragraphs-0"),
        text("tokens/color", "explanation-paragraphs-1"),
        text("tokens/color", "explanation-paragraphs-2")
      ],
      links: [{ label: text("tokens/color", "explanation-links-0-label"), href: '/reference/tokens/color-roles' }, { label: text("tokens/color", "explanation-links-1-label"), href: '/reference/rules/declarations' }],
    },
    usage: {
      lead: text("tokens/color", "usage-lead"),
      html: '<div class="flex flex-wrap gap-xs">\n  <span class="px-xs py-3xs r-sm bg-green-5 fg-green-80 text-xs">Paid</span>\n  <span class="px-xs py-3xs r-sm bg-amber-5 fg-amber-80 text-xs">Pending</span>\n  <span class="px-xs py-3xs r-sm bg-red-5 fg-red-80 text-xs">Overdue</span>\n  <span class="px-xs py-3xs r-sm bg-blue-5 fg-blue-70 text-xs">Draft</span>\n</div>',
    },
    customize: {
      lead: text("tokens/color", "customize-lead"),
      theme: '@theme {\n  --color-brand: oklch(56% .2 262);\n}',
      html: '<button class="bg-brand">…</button>',
    },
    guide: { label: text("tokens/color", "guide-label"), href: '/guide/colors' },
  },
  {
    id: 'color-roles',
    title: text("tokens/color-roles", "title"),
    summary: text("tokens/color-roles", "summary"),
    groups: [
      { namespace: 'color-text', title: text("tokens/color-roles", "groups-0-title"), prefix: 'fg' },
      { namespace: 'color-surface', title: text("tokens/color-roles", "groups-1-title"), prefix: 'bg' },
      { namespace: 'color-line', title: text("tokens/color-roles", "groups-2-title"), prefix: 'b' },
    ],
    primary: ['fg', 'bg', 'b'],
    note: text("tokens/color-roles", "note"),
    valuesLead: text("tokens/color-roles", "valuesLead"),
    explanation: {
      id: 'color-scheme', title: text("tokens/color-roles", "explanation-title"), illustration: 'role-value-selection',
      paragraphs: [
        text("tokens/color-roles", "explanation-paragraphs-0"),
        text("tokens/color-roles", "explanation-paragraphs-1"),
        text("tokens/color-roles", "explanation-paragraphs-2"),
        text("tokens/color-roles", "explanation-paragraphs-3")
      ],
      links: [{ label: text("tokens/color-roles", "explanation-links-0-label"), href: '/reference/rules/modes#mode-triggers' }, { label: text("tokens/color-roles", "explanation-links-1-label"), href: 'https://www.w3.org/TR/css-color-5/#light-dark' }],
    },
    usage: {
      lead: text("tokens/color-roles", "usage-lead"),
      html: '<article class="p-md r-lg b(1) b-solid b-line-divider bg-surface-raised">\n  <h3 class="m(0) text-md font-regular fg-text-strong">Make space for ideas</h3>\n  <p class="mt-xs mb(0) text-sm fg-text-body">A steady rhythm keeps the focus on the content.</p>\n  <p class="mt-md mb(0) pt-sm bt(1) bt-solid bt-line-divider text-xs fg-text-muted">4 min read</p>\n</article>',
      keep: ['b(1)', 'b-solid', 'bt(1)', 'bt-solid'],
    },
    customize: {
      lead: text("tokens/color-roles", "customize-lead"),
      theme: '@theme {\n  --color-text-brand: light-dark(\n    var(--color-indigo-60),\n    var(--color-indigo-30)\n  );\n}',
      html: '<p class="fg-text-brand">…</p>',
    },
    guide: { label: text("tokens/color-roles", "guide-label"), href: '/guide/colors#choose-a-color-token' },
  },
  {
    id: 'spacing',
    title: text("tokens/spacing", "title"),
    summary: text("tokens/spacing", "summary"),
    groups: [{ namespace: 'spacing', prefix: 'p' }],
    primary: ['p', 'm', 'gap'],
    note: text("tokens/spacing", "note"),
    valuesLead: text("tokens/spacing", "valuesLead"),
    explanation: {
      id: 'spacing-boundaries', title: text("tokens/spacing", "explanation-title"), illustration: 'spacing-boundaries',
      paragraphs: [
        text("tokens/spacing", "explanation-paragraphs-0"),
        text("tokens/spacing", "explanation-paragraphs-1"),
        text("tokens/spacing", "explanation-paragraphs-2")
      ],
      links: [{ label: text("tokens/spacing", "explanation-links-0-label"), href: '/reference/rules/declarations#negative' }, { label: text("tokens/spacing", "explanation-links-1-label"), href: '/reference/direct-values' }, { label: text("tokens/spacing", "explanation-links-2-label"), href: 'https://www.w3.org/TR/css-align-3/#gaps' }],
    },
    usage: {
      lead: text("tokens/spacing", "usage-lead"),
      html: '<form class="grid gap-md p-md r-lg b(1) b-solid b-line-divider bg-surface-raised">\n  <label class="grid gap-2xs text-sm fg-text-body">Name<input class="w-full min-w(0) px-sm py-xs r-md b(1) b-solid b-line-control bg-surface-base fg-text-body text-sm outline(2):focus-visible outline-solid:focus-visible outline-line-control:focus-visible outline-offset(2):focus-visible" value="Aron" /></label>\n  <label class="grid gap-2xs text-sm fg-text-body">Email<input type="email" class="w-full min-w(0) px-sm py-xs r-md b(1) b-solid b-line-control bg-surface-base fg-text-body text-sm outline(2):focus-visible outline-solid:focus-visible outline-line-control:focus-visible outline-offset(2):focus-visible" value="aron@example.com" /></label>\n</form>',
      keep: ['grid'],
    },
    customize: {
      lead: text("tokens/spacing", "customize-lead"),
      theme: '@theme {\n  --spacing-card: 1.25rem;\n}',
      html: '<div class="p-card">…</div>',
    },
    guide: { label: text("tokens/spacing", "guide-label"), href: '/guide/layout-system#namespace-for-spacing' },
  },
  {
    id: 'container',
    title: text("tokens/container", "title"),
    summary: text("tokens/container", "summary"),
    groups: [{ namespace: 'container', prefix: 'max-w' }],
    primary: ['max-w', 'w'],
    note: text("tokens/container", "note"),
    valuesLead: text("tokens/container", "valuesLead"),
    explanation: {
      id: 'size-limits', title: text("tokens/container", "explanation-title"), illustration: 'container-cap',
      paragraphs: [
        text("tokens/container", "explanation-paragraphs-0"),
        text("tokens/container", "explanation-paragraphs-1"),
        text("tokens/container", "explanation-paragraphs-2")
      ],
      links: [{ label: text("tokens/container", "explanation-links-0-label"), href: '/reference/rules/named-conditions' }, { label: text("tokens/container", "explanation-links-1-label"), href: '/reference/rules/conditions#containersize' }, { label: text("tokens/container", "explanation-links-2-label"), href: 'https://www.w3.org/TR/css-sizing-3/#sizing-properties' }],
    },
    usage: {
      lead: text("tokens/container", "usage-lead"),
      html: '<div class="max-w-xs mx-auto p-lg r-xl b(1) b-solid b-line-divider bg-surface-floating shadow-lg">\n  <p class="m(0) fg-text-strong">Leave this page?</p>\n  <p class="mt-xs mb(0) max-w-3xs text-sm fg-text-muted">Changes you made will not be saved.</p>\n</div>',
    },
    customize: {
      lead: text("tokens/container", "customize-lead"),
      theme: '@theme {\n  --container-prose: 40rem;\n}',
      html: '<article class="max-w-prose">…</article>',
    },
    guide: { label: text("tokens/container", "guide-label"), href: '/guide/layout-system#use-container-tokens' },
  },
  {
    id: 'radius',
    title: text("tokens/radius", "title"),
    summary: text("tokens/radius", "summary"),
    groups: [{ namespace: 'radius', prefix: 'r' }],
    note: text("tokens/radius", "note"),
    valuesLead: text("tokens/radius", "valuesLead"),
    explanation: {
      id: 'rounding-and-clipping', title: text("tokens/radius", "explanation-title"), illustration: 'radius-clipping',
      paragraphs: [
        text("tokens/radius", "explanation-paragraphs-0"),
        text("tokens/radius", "explanation-paragraphs-1"),
        text("tokens/radius", "explanation-paragraphs-2"),
        text("tokens/radius", "explanation-paragraphs-3")
      ],
      links: [{ label: text("tokens/radius", "explanation-links-0-label"), href: 'https://www.w3.org/TR/css-backgrounds-3/#corner-clipping' }, { label: text("tokens/radius", "explanation-links-1-label"), href: '/reference/direct-values' }],
    },
    usage: {
      lead: text("tokens/radius", "usage-lead"),
      html: '<div class="flex flex-wrap items-center gap-md p-md r-lg b(1) b-solid b-line-divider bg-surface-raised shadow-xs">\n  <div class="shrink(0) flex items-center justify-center w(56) h(56) r-md bg-line-subtle text-sm fg-text-muted">FN</div>\n  <div class="grow(1) min-w(0)">\n    <p class="m(0) fg-text-strong">Field notes</p>\n    <p class="mt-3xs mb(0) text-sm fg-text-muted">Every Friday</p>\n  </div>\n  <span class="px-sm py-3xs pill bg-line-subtle fg-text-muted text-xs">Weekly</span>\n</div>',
      keep: ['pill'],
    },
    customize: {
      lead: text("tokens/radius", "customize-lead"),
      theme: '@theme {\n  --radius-md: .5rem;\n  --radius-card: 1.25rem;\n}',
      html: '<div class="r-card">…</div>',
    },
    guide: { label: text("tokens/radius", "guide-label"), href: '/guide/colors#raised-surfaces' },
  },
  {
    id: 'shadow',
    title: text("tokens/shadow", "title"),
    summary: text("tokens/shadow", "summary"),
    groups: [{ namespace: 'shadow', prefix: 'shadow' }],
    note: text("tokens/shadow", "note"),
    valuesLead: text("tokens/shadow", "valuesLead"),
    explanation: {
      id: 'paint-and-layout', title: text("tokens/shadow", "explanation-title"), illustration: 'shadow-footprint',
      paragraphs: [
        text("tokens/shadow", "explanation-paragraphs-0"),
        text("tokens/shadow", "explanation-paragraphs-1"),
        text("tokens/shadow", "explanation-paragraphs-2"),
        text("tokens/shadow", "explanation-paragraphs-3")
      ],
      links: [{ label: text("tokens/shadow", "explanation-links-0-label"), href: '/reference/tokens/color-roles#color-scheme' }, { label: text("tokens/shadow", "explanation-links-1-label"), href: 'https://www.w3.org/TR/css-backgrounds-3/#shadow-layers' }],
    },
    usage: {
      lead: text("tokens/shadow", "usage-lead"),
      html: '<div class="grid (grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr))) gap-lg items-start">\n  <article class="p-md r-lg bg-surface-raised shadow-xs">\n    <p class="m(0) fg-text-strong">Card</p>\n    <p class="mt-3xs mb(0) text-sm fg-text-muted">On the page</p>\n  </article>\n  <ul class="m(0) p-3xs r-lg bg-surface-floating shadow-lg (list-style:none)">\n    <li class="px-sm py-2xs r-sm bg-line-subtle text-sm fg-text-strong">Duplicate</li>\n    <li class="px-sm py-2xs text-sm fg-text-body">Rename</li>\n    <li class="px-sm py-2xs text-sm fg-text-body">Archive</li>\n  </ul>\n</div>',
    },
    customize: {
      lead: text("tokens/shadow", "customize-lead"),
      theme: '@theme {\n  --shadow-card:\n    0 1px 2px light-dark(oklch(0% 0 none / .08), oklch(0% 0 none / .4)),\n    0 12px 24px -12px light-dark(oklch(0% 0 none / .2), oklch(0% 0 none / .5));\n}',
      html: '<article class="shadow-card">…</article>',
    },
    guide: { label: text("tokens/shadow", "guide-label"), href: '/guide/colors#raised-surfaces' },
  },
  {
    id: 'font',
    title: text("tokens/font", "title"),
    summary: text("tokens/font", "summary"),
    groups: [
      { namespace: 'font-family', title: text("tokens/font", "groups-0-title"), placeholder: 'family', prefix: 'font' },
      { namespace: 'font-size', title: text("tokens/font", "groups-1-title"), placeholder: 'size', prefix: 'font' },
      { namespace: 'font-weight', title: text("tokens/font", "groups-2-title"), placeholder: 'weight', prefix: 'font' },
    ],
    note: text("tokens/font", "note"),
    valuesLead: text("tokens/font", "valuesLead"),
    explanation: {
      id: 'independent-properties', title: text("tokens/font", "explanation-title"), illustration: 'font-properties',
      paragraphs: [
        text("tokens/font", "explanation-paragraphs-0"),
        text("tokens/font", "explanation-paragraphs-1"),
        text("tokens/font", "explanation-paragraphs-2"),
        text("tokens/font", "explanation-paragraphs-3")
      ],
      links: [{ label: text("tokens/font", "explanation-links-0-label"), href: '/reference/tokens/text' }, { label: text("tokens/font", "explanation-links-1-label"), href: '/reference/rules/modes#namespace-resolution' }, { label: text("tokens/font", "explanation-links-2-label"), href: 'https://www.w3.org/TR/css-fonts-4/#font-family-prop' }],
    },
    usage: {
      lead: text("tokens/font", "usage-lead"),
      html: '<h3 class="m(0) font-2xl font-medium fg-text-strong">Release notes</h3>\n<p class="mt-xs mb(0) font-sm fg-text-muted">Install the new version with <code class="font-mono font-xs fg-text-body">npm i @master/css</code>.</p>',
    },
    customize: {
      lead: text("tokens/font", "customize-lead"),
      theme: '@theme {\n  --font-family-display: "Inter Display", var(--font-family-sans);\n  --font-size-hero: 4rem;\n}',
      html: '<h1 class="font-display font-hero">…</h1>',
    },
    guide: { label: text("tokens/font", "guide-label"), href: '/guide/typography' },
  },
  {
    id: 'text',
    title: text("tokens/text", "title"),
    summary: text("tokens/text", "summary"),
    groups: [{ namespace: 'text', prefix: 'text' }],
    declarations: { text: 'font-size: var(--text-<name>);\nline-height: var(--text-<name>--line-height, normal);\nletter-spacing: var(--text-<name>--letter-spacing, normal);' },
    note: text("tokens/text", "note"),
    valuesLead: text("tokens/text", "valuesLead"),
    explanation: {
      id: 'primary-and-companions', title: text("tokens/text", "explanation-title"), illustration: 'text-companions',
      paragraphs: [
        text("tokens/text", "explanation-paragraphs-0"),
        text("tokens/text", "explanation-paragraphs-1"),
        text("tokens/text", "explanation-paragraphs-2"),
        text("tokens/text", "explanation-paragraphs-3")
      ],
      links: [{ label: text("tokens/text", "explanation-links-0-label"), href: '/reference/tokens/font' }, { label: text("tokens/text", "explanation-links-1-label"), href: '/reference/tokens/leading' }, { label: text("tokens/text", "explanation-links-2-label"), href: '/reference/tokens/tracking' }, { label: text("tokens/text", "explanation-links-3-label"), href: '/reference/rules/layers' }],
    },
    usage: {
      lead: text("tokens/text", "usage-lead"),
      html: '<p class="m(0) text-lg font-regular fg-text-body">A paragraph keeps its size, line height and letter spacing together. Its container can grow when the same text wraps onto another line.</p>',
    },
    customize: {
      lead: text("tokens/text", "customize-lead"),
      theme: '@theme {\n  --text-display: 3.5rem;\n  --text-display--line-height: 1.1;\n  --text-display--letter-spacing: -.03em;\n}',
      html: '<h1 class="text-display">…</h1>',
    },
    guide: { label: text("tokens/text", "guide-label"), href: '/guide/typography' },
  },
  {
    id: 'leading',
    title: text("tokens/leading", "title"),
    summary: text("tokens/leading", "summary"),
    groups: [{ namespace: 'leading', prefix: 'leading' }],
    note: text("tokens/leading", "note"),
    valuesLead: text("tokens/leading", "valuesLead"),
    explanation: {
      id: 'inherited-ratio', title: text("tokens/leading", "explanation-title"), illustration: 'leading-ratio',
      paragraphs: [
        text("tokens/leading", "explanation-paragraphs-0"),
        text("tokens/leading", "explanation-paragraphs-1"),
        text("tokens/leading", "explanation-paragraphs-2"),
        text("tokens/leading", "explanation-paragraphs-3")
      ],
      links: [{ label: text("tokens/leading", "explanation-links-0-label"), href: '/reference/tokens/text#primary-and-companions' }, { label: text("tokens/leading", "explanation-links-1-label"), href: 'https://www.w3.org/TR/css-inline-3/#propdef-line-height' }],
    },
    usage: {
      lead: text("tokens/leading", "usage-lead"),
      html: '<div class="grid gap-md leading-md">\n  <p class="m(0) font-sm fg-text-body">The same ratio follows this text as its font size changes. Each line leaves room to find the next.</p>\n  <p class="m(0) font-lg fg-text-body">The same ratio follows this text as its font size changes. Each line leaves room to find the next.</p>\n</div>',
      keep: ['font-sm', 'font-lg'],
    },
    customize: {
      lead: text("tokens/leading", "customize-lead"),
      theme: '@theme {\n  --leading-prose: 1.7;\n}',
      html: '<p class="leading-prose">…</p>',
    },
    guide: { label: text("tokens/leading", "guide-label"), href: '/guide/typography#without-vs-with-text-token' },
  },
  {
    id: 'tracking',
    title: text("tokens/tracking", "title"),
    summary: text("tokens/tracking", "summary"),
    groups: [{ namespace: 'tracking', prefix: 'tracking' }],
    note: text("tokens/tracking", "note"),
    valuesLead: text("tokens/tracking", "valuesLead"),
    explanation: {
      id: 'computed-spacing', title: text("tokens/tracking", "explanation-title"), illustration: 'tracking-inheritance',
      paragraphs: [
        text("tokens/tracking", "explanation-paragraphs-0"),
        text("tokens/tracking", "explanation-paragraphs-1"),
        text("tokens/tracking", "explanation-paragraphs-2"),
        text("tokens/tracking", "explanation-paragraphs-3")
      ],
      links: [{ label: text("tokens/tracking", "explanation-links-0-label"), href: '/reference/tokens/leading#inherited-ratio' }, { label: text("tokens/tracking", "explanation-links-1-label"), href: '/reference/tokens/text#primary-and-companions' }, { label: text("tokens/tracking", "explanation-links-2-label"), href: 'https://www.w3.org/TR/css-text-3/#letter-spacing-property' }],
    },
    usage: {
      lead: text("tokens/tracking", "usage-lead"),
      html: '<div class="grid gap-md leading-md fg-text-body">\n  <p class="m(0) font-lg tracking-tight">Letter spacing shapes this line.</p>\n  <p class="m(0) font-lg tracking-widest">Letter spacing shapes this line.</p>\n</div>',
      keep: ['font-lg'],
    },
    customize: {
      lead: text("tokens/tracking", "customize-lead"),
      theme: '@theme {\n  --tracking-tight: -.03em;\n  --tracking-display: -.05em;\n}',
      html: '<h1 class="tracking-display">…</h1>',
    },
    guide: { label: text("tokens/tracking", "guide-label"), href: '/guide/typography#without-vs-with-text-token' },
  },
  {
    id: 'motion',
    title: text("tokens/motion", "title"),
    summary: text("tokens/motion", "summary"),
    groups: [
      { namespace: 'animate', title: text("tokens/motion", "groups-0-title"), placeholder: 'animation', prefix: 'animate' },
      { namespace: 'duration', title: text("tokens/motion", "groups-1-title"), placeholder: 'duration', prefix: 'transition' },
      { namespace: 'easing', title: text("tokens/motion", "groups-2-title"), placeholder: 'easing', prefix: 'transition' },
    ],
    note: text("tokens/motion", "note"),
    valuesLead: text("tokens/motion", "valuesLead"),
    explanation: {
      id: 'duration-overrides', title: text("tokens/motion", "explanation-title"), illustration: 'motion-duration-override',
      paragraphs: [
        text("tokens/motion", "explanation-paragraphs-0"),
        text("tokens/motion", "explanation-paragraphs-1"),
        text("tokens/motion", "explanation-paragraphs-2"),
        text("tokens/motion", "explanation-paragraphs-3"),
        text("tokens/motion", "explanation-paragraphs-4")
      ],
      links: [{ label: text("tokens/motion", "explanation-links-0-label"), href: '/reference/rules/layers' }, { label: text("tokens/motion", "explanation-links-1-label"), href: 'https://www.w3.org/TR/css-animations-1/#animation' }, { label: text("tokens/motion", "explanation-links-2-label"), href: '/guide/view-transitions' }],
    },
    usage: {
      lead: text("tokens/motion", "usage-lead"),
      html: '<a href="#values" class="inline-block px-md py-xs r-md b(1) b-solid b-line-control bg-surface-raised text-sm fg-text-strong (text-decoration:none) (transition-property:background-color) transition-fast@motion-safe transition-smooth@motion-safe bg-surface-inset:hover">View motion values</a>',
      keep: ['(transition-property:background-color)', 'bg-surface-inset:hover'],
    },
    customize: {
      lead: text("tokens/motion", "customize-lead"),
      theme: '@theme {\n  --animate-reveal:\n    reveal var(--duration-slow) var(--easing-crisp) both;\n}\n\n@keyframes reveal {\n  from { opacity: 0; translate: 0 .5rem; }\n}',
      html: '<section class="animate-reveal@motion-safe">…</section>',
    },
    guide: { label: text("tokens/motion", "guide-label"), href: '/guide/theme#define-motion-tokens' },
  },
]

export const recipePages: RecipePageEditorial[] = [
  {
    id: 'grid-tracks',
    title: text("grid-tracks", "title"),
    summary: text("grid-tracks", "summary"),
    names: ['grid-cols', 'grid-rows', 'grid-col-span', 'grid-row-span'],
    note: text("grid-tracks", "note"),
    explanation: {
      id: 'tracks-and-flow', title: text("grid-tracks", "explanation-title"), illustration: 'grid-track-flow',
      paragraphs: [
        text("grid-tracks", "explanation-paragraphs-0"),
        text("grid-tracks", "explanation-paragraphs-1"),
        text("grid-tracks", "explanation-paragraphs-2"),
        text("grid-tracks", "explanation-paragraphs-3"),
        text("grid-tracks", "explanation-paragraphs-4")
      ],
      links: [{ label: text("grid-tracks", "explanation-links-0-label"), href: '/guide/layout-system#build-column-grids' }, { label: text("grid-tracks", "explanation-links-1-label"), href: 'https://www.w3.org/TR/css-grid-2/#auto-placement-algo' }],
    },
    usage: {
      lead: text("grid-tracks", "usage-lead"),
      html: '<div class="grid-cols(3) gap-xs wrap-anywhere">\n  <div class="grid-col-span(2) grid-row-span(2) flex items-end p(8) r-md bg-surface-raised b(1) b-solid b-line-divider text-sm fg-text-strong">Feature</div>\n  <div class="p(8) r-md b(1) b-solid b-line-divider text-sm fg-text-body">Notes</div>\n  <div class="p(8) r-md b(1) b-solid b-line-divider text-sm fg-text-body">Drafts</div>\n  <div class="p(8) r-md b(1) b-solid b-line-divider text-sm fg-text-body">Archive</div>\n  <div class="p(8) r-md b(1) b-solid b-line-divider text-sm fg-text-body">Shared</div>\n  <div class="p(8) r-md b(1) b-solid b-line-divider text-sm fg-text-body">Trash</div>\n</div>',
      keep: ['gap-xs'],
    },
    guide: { label: text("grid-tracks", "guide-label"), href: '/guide/layout-system#build-column-grids' },
  },
  {
    id: 'truncation',
    title: text("truncation", "title"),
    summary: text("truncation", "summary"),
    names: ['truncate', 'clamp-lines'],
    note: text("truncation", "note"),
    explanation: {
      id: 'visible-lines', title: text("truncation", "explanation-title"), illustration: 'truncation-lines',
      paragraphs: [
        text("truncation", "explanation-paragraphs-0"),
        text("truncation", "explanation-paragraphs-1"),
        text("truncation", "explanation-paragraphs-2"),
        text("truncation", "explanation-paragraphs-3"),
        text("truncation", "explanation-paragraphs-4")
      ],
      links: [{ label: text("truncation", "explanation-links-0-label"), href: 'https://www.w3.org/TR/css-overflow-3/#text-overflow' }, { label: text("truncation", "explanation-links-1-label"), href: 'https://www.w3.org/TR/css-overflow-4/#webkit-line-clamp' }],
    },
    usage: {
      lead: text("truncation", "usage-lead"),
      html: `<article class="max-w-3xs mx-auto p-md r-lg b(1) b-solid b-line-divider bg-surface-raised wrap-anywhere">\n  <p class="m(0) text-sm fg-text-strong truncate">field-notes-autumn-collection-final-v03.fig</p>\n  <p class="mt-2xs mb(0) text-sm fg-text-muted clamp-lines(2)">${article}</p>\n  <details class="mt-md text-sm fg-text-body"><summary class="(cursor:pointer)">Read full details</summary><p class="mt-sm mb-xs font-mono font-xs">field-notes-autumn-collection-final-v03.fig</p><p class="m(0)">${article}</p></details>\n</article>`,
      keep: ['max-w-3xs'],
    },
    guide: { label: text("truncation", "guide-label"), href: '/guide/typography' },
  },
  {
    id: 'sr-only',
    title: text("sr-only", "title"),
    summary: text("sr-only", "summary"),
    names: ['sr-only'],
    note: text("sr-only", "note"),
    explanation: {
      id: 'visual-and-accessible', title: text("sr-only", "explanation-title"), illustration: 'screen-reader-name',
      paragraphs: [
        text("sr-only", "explanation-paragraphs-0"),
        text("sr-only", "explanation-paragraphs-1"),
        text("sr-only", "explanation-paragraphs-2"),
        text("sr-only", "explanation-paragraphs-3")
      ],
      links: [{ label: text("sr-only", "explanation-links-0-label"), href: 'https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/' }],
    },
    usage: {
      lead: text("sr-only", "usage-lead"),
      html: '<a href="#customize" class="inline-flex items-center justify-center w(40) h(40) r-md b(1) b-solid b-line-control bg-surface-raised text-lg fg-text-strong (text-decoration:none)">\n  <span aria-hidden="true">↓</span>\n  <span class="sr-only">Read the utility definition</span>\n</a>',
    },
    caption: text("sr-only", "caption"),
  },
  {
    id: 'direct-values',
    title: text("direct-values", "title"),
    summary: text("direct-values", "summary"),
    names: ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'mxs', 'mxe', 'my', 'mys', 'mye', 'p', 'pt', 'pr', 'pb', 'pl', 'px', 'pxs', 'pxe', 'py', 'pys', 'pye', 'scroll-m', 'scroll-mt', 'scroll-mr', 'scroll-mb', 'scroll-ml', 'scroll-mx', 'scroll-mxs', 'scroll-mxe', 'scroll-my', 'scroll-mys', 'scroll-mye', 'scroll-p', 'scroll-pt', 'scroll-pr', 'scroll-pb', 'scroll-pl', 'scroll-px', 'scroll-pxs', 'scroll-pxe', 'scroll-py', 'scroll-pys', 'scroll-pye', 'top', 'right', 'bottom', 'left', 'inset', 'ix', 'ixs', 'ixe', 'iy', 'iys', 'iye', 'gap', 'col-gap', 'row-gap', 'border-spacing', 'outline-offset', 'shape-margin', 'translate', 'word-spacing', 'w', 'h', 'size-x', 'size-y', 'min-w', 'min-h', 'min-size-x', 'min-size-y', 'max-w', 'max-h', 'max-size-x', 'max-size-y', 'basis', 'r', 'rtl', 'rtr', 'rbl', 'rbr', 'rss', 'rse', 'res', 'ree', 'b', 'bt', 'br', 'bb', 'bl', 'bx', 'bxs', 'bxe', 'by', 'bys', 'bye', 'outline', 'grow', 'shrink', 'order'],
    primary: ['m', 'p', 'gap', 'w', 'h', 'r', 'b', 'grow', 'shrink', 'order'],
    note: text("direct-values", "note"),
    explanation: {
      id: 'number-meaning', title: text("direct-values", "explanation-title"), illustration: 'direct-number-units',
      paragraphs: [
        text("direct-values", "explanation-paragraphs-0"),
        text("direct-values", "explanation-paragraphs-1"),
        text("direct-values", "explanation-paragraphs-2"),
        text("direct-values", "explanation-paragraphs-3"),
        text("direct-values", "explanation-paragraphs-4")
      ],
      links: [{ label: text("direct-values", "explanation-links-0-label"), href: '/reference/tokens/spacing' }, { label: text("direct-values", "explanation-links-1-label"), href: '/reference/rules/declarations' }, { label: text("direct-values", "explanation-links-2-label"), href: 'https://www.w3.org/TR/css-flexbox-1/#flex-flex-grow-factor' }],
    },
    usage: {
      lead: text("direct-values", "usage-lead"),
      html: '<div class="flex flex-wrap gap(12) items-stretch">\n  <div class="p(12) r(10) b(1) b-solid b-line-divider bg-surface-raised text-sm fg-text-body">Fixed</div>\n  <div class="grow(1) p(12) r(10) b(1) b-dashed b-line-control text-sm fg-text-muted">Grows to fill</div>\n</div>',
      keep: ['flex', 'flex-wrap', 'b-solid', 'b-dashed'],
    },
  },
]

/** The language changes prose only; group identities and examples remain shared. */
export const localizedTokenPages = (locale = 'en') => tokenPages.map(page => referenceEditorial(page, `tokens/${page.id}`, locale))
export const localizedRecipePages = (locale = 'en') => recipePages.map(page => referenceEditorial(page, page.id, locale))
