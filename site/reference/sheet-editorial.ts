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
    title: 'Color palette',
    summary: 'Every numbered palette step, fixed hue alias and other preset color token.',
    groups: [
      { namespace: 'color', keys: 'palette', title: 'Palette', palette: true, prefix: 'bg' },
      { namespace: 'color', keys: 'aliases', title: 'Hue aliases', prefix: 'bg' },
      { namespace: 'color', keys: 'other', title: 'Other colors', prefix: 'bg' },
    ],
    primary: ['bg', 'fg', 'b'],
    note: 'A color class sets only the named property. For a visible border, combine a width such as `b(1)`, a style such as `b-solid` and a color such as `b-blue-60`. Color roles use these same families and have their own value tables.',
    valuesLead: 'Palette numbers are token keys, not opacity or lightness percentages. Higher numbered steps have lower OKLCH lightness. Each swatch copies its CSS value or variable reference; hue aliases below retain their authored token reference.',
    explanation: {
      id: 'hue-aliases', title: 'Hue aliases select a fixed step', illustration: 'hue-alias-selection',
      paragraphs: [
        '`bg-blue` reads `--color-blue`, whose preset value is `var(--color-blue-60)`. `bg-yellow` instead reaches `--color-yellow-40`. The alias does not imply a common step number across hues.',
        'Numbered steps and hue aliases do not switch with the color scheme. Adaptive text aliases such as `fg-text-blue` belong to Color roles. Redefining a token can change either behavior.',
        '`bg-current` reads `currentColor`, so its result follows the element’s text color. There is no preset `--color-transparent` token. For transparency or another literal color, use a native declaration such as `(background-color:transparent)` or `(background-color:#175fe9)`.'
      ],
      links: [{ label: 'Color roles', href: '/reference/tokens/color-roles' }, { label: 'native values and opacity', href: '/reference/rules/declarations' }],
    },
    usage: {
      lead: 'These status labels use explicit foreground and background steps. The words retain their meaning without color, and the selected colors stay fixed in both schemes.',
      html: '<div class="flex flex-wrap gap-xs">\n  <span class="px-xs py-3xs r-sm bg-green-5 fg-green-80 text-xs">Paid</span>\n  <span class="px-xs py-3xs r-sm bg-amber-5 fg-amber-80 text-xs">Pending</span>\n  <span class="px-xs py-3xs r-sm bg-red-5 fg-red-80 text-xs">Overdue</span>\n  <span class="px-xs py-3xs r-sm bg-blue-5 fg-blue-70 text-xs">Draft</span>\n</div>',
    },
    customize: {
      lead: 'Register a color in `@theme` to make its key available to the color families. Here `brand` is available as `bg-brand`, `fg-brand` and `b-brand`, among others.',
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
    note: 'A role is part of the color key: `fg-text-muted` reads `--color-text-muted` through the color namespace. Every color family accepts role keys, including `bg-text-link` and `outline-line-control`; the role name does not restrict the property.',
    valuesLead: 'Light and Dark are the two arguments of each preset light-dark() value. They are selected by the element’s used color scheme, not by the class prefix or the operating system alone.',
    explanation: {
      id: 'color-scheme', title: 'The local color scheme selects the value', illustration: 'role-value-selection',
      paragraphs: [
        '`fg-text-muted` emits `color: var(--color-text-muted)`. Its preset value uses `light-dark(var(--color-zinc-60), var(--color-zinc-40))`: light selects the first color, dark the second. The class and generated rule stay the same.',
        'The preset enables `color-scheme: light dark` on the root. Its `data-theme="light"` and `data-theme="dark"` selectors can choose a scheme on the root, a nested region or a shadow host. Native CSS performs the selection; switching schemes does not require regenerating this utility.',
        'The `@dark` and `@light` class suffixes test the system preference. A manual `data-theme` choice does not activate those media queries. Use the mode contract for selector-based conditions.',
        'A role supplies a color, not a component or a contrast guarantee for every background. Inverse surfaces have a paired inverse text role. Divider and subtle lines are decorative; control lines identify boundaries. Recheck the actual pair when changing a surface, opacity or token value.'
      ],
      links: [{ label: 'Variables and modes', href: '/reference/rules/modes#mode-triggers' }, { label: 'native light-dark() selection', href: 'https://www.w3.org/TR/css-color-5/#light-dark' }],
    },
    usage: {
      lead: 'Build a card from roles: a raised surface, a divider line, and strong, body and muted text.',
      html: '<article class="p-md r-lg b(1) b-solid b-line-divider bg-surface-raised">\n  <h3 class="m(0) text-md font-regular fg-text-strong">Make space for ideas</h3>\n  <p class="mt-xs mb(0) text-sm fg-text-body">A steady rhythm keeps the focus on the content.</p>\n  <p class="mt-md mb(0) pt-sm bt(1) bt-solid bt-line-divider text-xs fg-text-muted">4 min read</p>\n</article>',
      keep: ['b(1)', 'b-solid', 'bt(1)', 'bt-solid'],
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
    note: 'The family selects the property; the token supplies the distance. `px-` and `mx-` use the inline axis, while `pl-` and `ml-` use the physical left side. The complete family table lists each native property.',
    valuesLead: 'The preset scale uses rem lengths. Pixel equivalents assume a 16px root font size; the browser uses the actual root font size. Use direct-value functions such as `p(0)` for zero or `p(1)` for one CSS pixel.',
    explanation: {
      id: 'spacing-boundaries', title: 'One distance, different boundaries', illustration: 'spacing-boundaries',
      paragraphs: [
        '`p-md` and `gap-md` both read `--spacing-md`, but padding separates content from its box edge while gap separates items in the layout. A gap does not create outer padding.',
        '`gap-md` sets the gap value; it does not enable Grid or Flexbox. Likewise, an inset token sets an offset but does not choose a positioning scheme. The native property and layout determine the effect.',
        'Negative token forms depend on the consumer: `-mt-md` is accepted, while `-p-md` is rejected. The preset has no zero or auto spacing token; use `m(0)` for zero and a fixed utility such as `mx-auto` for automatic inline margins.'
      ],
      links: [{ label: 'negative values', href: '/reference/rules/declarations#negative' }, { label: 'direct values', href: '/reference/direct-values' }, { label: 'native gap behavior', href: 'https://www.w3.org/TR/css-align-3/#gaps' }],
    },
    usage: {
      lead: 'Pad a form, space its fields and separate each label from its control.',
      html: '<form class="grid gap-md p-md r-lg b(1) b-solid b-line-divider bg-surface-raised">\n  <label class="grid gap-2xs text-sm fg-text-body">Name<input class="w-full min-w(0) px-sm py-xs r-md b(1) b-solid b-line-control bg-surface-base fg-text-body text-sm outline(2):focus-visible outline-solid:focus-visible outline-line-control:focus-visible outline-offset(2):focus-visible" value="Aron" /></label>\n  <label class="grid gap-2xs text-sm fg-text-body">Email<input type="email" class="w-full min-w(0) px-sm py-xs r-md b(1) b-solid b-line-control bg-surface-base fg-text-body text-sm outline(2):focus-visible outline-solid:focus-visible outline-line-control:focus-visible outline-offset(2):focus-visible" value="aron@example.com" /></label>\n</form>',
      keep: ['grid'],
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
    summary: 'Preset lengths for width, height, minimum and maximum sizes.',
    groups: [{ namespace: 'container', prefix: 'max-w' }],
    primary: ['max-w', 'w'],
    note: 'Container tokens set lengths; they do not define viewport or container queries. Full and intrinsic sizes such as `w-full`, `max-w-fit` and `basis-min` are fixed utilities, independent of these tokens.',
    valuesLead: 'Each value is a length consumed by sizing properties. Pixel equivalents assume a 16px root font size. These are not viewport breakpoints or container-query definitions.',
    explanation: {
      id: 'size-limits', title: 'A maximum is an upper bound', illustration: 'container-cap',
      paragraphs: [
        '`max-w-3xs` sets `max-width: var(--container-3xs)`, whose preset value is `16rem`. An ordinary block with auto width can be narrower when its containing block has less room.',
        '`w-3xs` instead sets the width. Neither class adds centering, padding or query containment. Changing `--container-md` does not redefine `@container(--md)` or an explicit query threshold. Use native `container-type` and `container-name` when establishing a query container.',
        'The native layout still matters: minimum sizes, box sizing, Flexbox and Grid can affect the used size. A maximum does not change text-wrapping or overflow rules. For a page wrapper and responsive layout decisions, continue with the Layout guide.'
      ],
      links: [{ label: 'named query conditions', href: '/reference/rules/named-conditions' }, { label: 'container query grammar', href: '/reference/rules/conditions#containersize' }, { label: 'native sizing rules', href: 'https://www.w3.org/TR/css-sizing-3/#sizing-properties' }],
    },
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
    valuesLead: 'The eight preset radii are rem lengths. Pixel equivalents assume a 16px root font size. A radius shapes corners; it does not set the box dimensions.',
    explanation: {
      id: 'rounding-and-clipping', title: 'Rounding and clipping are separate', illustration: 'radius-clipping',
      paragraphs: [
        '`r-4xl` rounds the parent’s background and border. It does not give a child the same radius or automatically clip that child’s painting. Add `overflow-hidden` when the parent should clip its contents to the rounded edge.',
        'The physical families such as `rtl-` always address the top-left corner. Logical families such as `rss-` follow the block-start and inline-start sides, so their physical corner depends on writing mode and direction. Every mapping is listed above.',
        'Oversized radii are reduced by the browser when adjacent curves would overlap. This is why `pill` produces a capsule on a wide box and a circle on a square. It does not make an element square.',
        'For a square corner use the direct-value function `r(0)` or its single-corner counterpart, such as `rtl(0)`. The preset has no `--radius-none` token. Negative token forms such as `-r-md` are rejected.'
      ],
      links: [{ label: 'native corner clipping', href: 'https://www.w3.org/TR/css-backgrounds-3/#corner-clipping' }, { label: 'direct values', href: '/reference/direct-values' }],
    },
    usage: {
      lead: 'Step the radius down from a sheet to the thumbnail inside it.',
      html: '<div class="flex flex-wrap items-center gap-md p-md r-lg b(1) b-solid b-line-divider bg-surface-raised shadow-xs">\n  <div class="shrink(0) flex items-center justify-center w(56) h(56) r-md bg-line-subtle text-sm fg-text-muted">FN</div>\n  <div class="grow(1) min-w(0)">\n    <p class="m(0) fg-text-strong">Field notes</p>\n    <p class="mt-3xs mb(0) text-sm fg-text-muted">Every Friday</p>\n  </div>\n  <span class="px-sm py-3xs pill bg-line-subtle fg-text-muted text-xs">Weekly</span>\n</div>',
      keep: ['pill'],
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
    note: '`shadow-<name>` writes the complete `box-shadow` value. Two shadow classes do not append their lists; the winning declaration supplies the entire shadow.',
    valuesLead: 'Each token stores a comma-separated list of native shadows. Expand a value to inspect every layer. Light and dark use the same offsets, blur and spread lengths with different light-dark() colors.',
    explanation: {
      id: 'paint-and-layout', title: 'A shadow changes paint, not layout', illustration: 'shadow-footprint',
      paragraphs: [
        '`shadow-xs` and `shadow-xl` produce different painted footprints around the same box. Neither reserves room for its shadow: the following element keeps the same position and gap.',
        'The first shadow in a token’s list is painted on top of the later shadows. `shadow-inset` uses inner shadows; the six size steps use outer shadows. The tokens do not supply a surface color, radius, stacking order or clipping policy.',
        'The element’s used color scheme selects each `light-dark()` color. It changes the paint without changing the shadow’s lengths or requiring another utility class. See Color roles for local scheme selection.',
        'To remove the shadow, use the native declaration `(box-shadow:none)`. To combine an inset with an outer shadow, define one token containing both lists; separate classes do not merge them.'
      ],
      links: [{ label: 'Color roles', href: '/reference/tokens/color-roles#color-scheme' }, { label: 'native shadow painting and layout', href: 'https://www.w3.org/TR/css-backgrounds-3/#shadow-layers' }],
    },
    usage: {
      lead: 'Keep resting surfaces low and lift only what floats above them.',
      html: '<div class="grid (grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr))) gap-lg items-start">\n  <article class="p-md r-lg bg-surface-raised shadow-xs">\n    <p class="m(0) fg-text-strong">Card</p>\n    <p class="mt-3xs mb(0) text-sm fg-text-muted">On the page</p>\n  </article>\n  <ul class="m(0) p-3xs r-lg bg-surface-floating shadow-lg (list-style:none)">\n    <li class="px-sm py-2xs r-sm bg-line-subtle text-sm fg-text-strong">Duplicate</li>\n    <li class="px-sm py-2xs text-sm fg-text-body">Rename</li>\n    <li class="px-sm py-2xs text-sm fg-text-body">Archive</li>\n  </ul>\n</div>',
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
    valuesLead: 'Families are ordered fallback lists, sizes are rem lengths and weights are numeric requests. Pixel equivalents assume a 16px root font size. The rendered face and available weights depend on the fonts loaded by the page.',
    explanation: {
      id: 'independent-properties', title: 'One prefix, independent properties', illustration: 'font-properties',
      paragraphs: [
        '`font-serif`, `font-4xl` and `font-semibold` write `font-family`, `font-size` and `font-weight` respectively. They can be combined because they set different properties; none is a complete type treatment.',
        'A size class leaves line height and letter spacing to their own declarations or inheritance. Use `text-<name>` when all three metrics should come from one treatment. Family and weight remain separate in either form.',
        'A family token names fonts; it does not download them. The preset sans, mono and serif stacks begin with the optional `--font-sans`, `--font-mono` and `--font-serif` hooks. The Typography guide owns loading fonts and choosing a site-wide stack.',
        'Keep custom keys distinct across the three namespaces. If both `--font-family-brand` and `--font-size-brand` exist, `font-brand` is ambiguous. An explicit native declaration such as `(font-size:var(--font-size-brand))` names the intended property and variable.'
      ],
      links: [{ label: 'Text treatments', href: '/reference/tokens/text' }, { label: 'namespace resolution', href: '/reference/rules/modes#namespace-resolution' }, { label: 'native font selection', href: 'https://www.w3.org/TR/css-fonts-4/#font-family-prop' }],
    },
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
    valuesLead: 'Each row shows the three values read by one class. Preset sizes reference the matching font-size token; the table resolves that reference for reading. All preset treatments include both companions.',
    explanation: {
      id: 'primary-and-companions', title: 'One primary token, three declarations', illustration: 'text-companions',
      paragraphs: [
        '`--text-card` registers `text-card`. The class always emits font size, line height and letter spacing. If `--text-card--line-height` or `--text-card--letter-spacing` is absent, its declaration uses `normal`; it does not preserve an inherited value.',
        'A companion alone does not register a treatment. Add the primary size token even when the only value you want to customize is its line height or letter spacing.',
        'A companion is a value used by this recipe, not another class name. Independent adjustments use `font-<size>`, `leading-<name>` or `tracking-<name>`. Under the same conditions, these single-property utilities sort after the text recipe and can override its corresponding declaration; their order in the class attribute does not decide the result.',
        'The recipe does not load a font, select its family or weight, add margins or decide the width of a paragraph. Typography Guide owns choosing and combining treatments into a hierarchy.'
      ],
      links: [{ label: 'Font', href: '/reference/tokens/font' }, { label: 'Leading', href: '/reference/tokens/leading' }, { label: 'Tracking', href: '/reference/tokens/tracking' }, { label: 'generated rule order', href: '/reference/rules/layers' }],
    },
    usage: {
      lead: 'Apply one treatment to a paragraph; its family, weight and color remain independent.',
      html: '<p class="m(0) text-lg font-regular fg-text-body">A paragraph keeps its size, line height and letter spacing together. Its container can grow when the same text wraps onto another line.</p>',
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
    note: '`leading-<name>` sets only `line-height`. It does not change font size, add a gap between paragraphs or constrain their height.',
    valuesLead: 'All five preset values are unitless ratios, not rem lengths or pixel counts. The used line height depends on the element’s font size.',
    explanation: {
      id: 'inherited-ratio', title: 'An inherited ratio follows each font size', illustration: 'leading-ratio',
      paragraphs: [
        '`leading-md` supplies the number `1.6`. A child that inherits it uses its own font size: 16px gives 25.6px, while 24px gives 38.4px. The inherited value is still the ratio.',
        'An explicit length or percentage has different inheritance behavior: it resolves to a length on the element where it is declared. Use a native declaration such as `(line-height:1.5)` or add a theme token for a custom ratio; there is no preset `leading(1.5)` function.',
        'Line height controls the line’s vertical metrics, not the empty gap between visible glyphs. Other inline content can make a line box taller. It does not crop glyphs or guarantee a fixed paragraph height.',
        'A `text-*` treatment sets its own line height, so it replaces an inherited ratio. Apply `leading-*` on that same element when intentionally overriding the treatment; under the same conditions, the single-property utility follows the recipe.'
      ],
      links: [{ label: 'Text treatment companions', href: '/reference/tokens/text#primary-and-companions' }, { label: 'native line-height inheritance', href: 'https://www.w3.org/TR/css-inline-3/#propdef-line-height' }],
    },
    usage: {
      lead: 'Set a ratio on the parent and let its children scale it with their own font sizes.',
      html: '<div class="grid gap-md leading-md">\n  <p class="m(0) font-sm fg-text-body">The same ratio follows this text as its font size changes. Each line leaves room to find the next.</p>\n  <p class="m(0) font-lg fg-text-body">The same ratio follows this text as its font size changes. Each line leaves room to find the next.</p>\n</div>',
      keep: ['font-sm', 'font-lg'],
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
    note: 'Tight keys already contain negative lengths; use `tracking-tight` directly. A signed token form such as `-tracking-tight` is not supported.',
    valuesLead: 'The nonzero preset values use em, relative to the font size where letter-spacing is declared. `tracking-normal` supplies zero; use `(letter-spacing:normal)` for the native keyword.',
    explanation: {
      id: 'computed-spacing', title: 'Inherited spacing keeps its computed length', illustration: 'tracking-inheritance',
      paragraphs: [
        '`tracking-widest` supplies `.12em`. At a 16px font size it computes to 1.92px. A child with a 32px font inherits that length; it does not automatically double the spacing.',
        'Apply `tracking-widest` on the child to evaluate `.12em` against its own 32px font size, producing 3.84px. This differs from the unitless ratios used by Leading.',
        'Letter spacing adjusts the spacing of text rather than stretching the glyph shapes. It can change line wrapping; keep the container free to grow and inspect the actual font and language.',
        'A `text-*` treatment includes a letter-spacing declaration. On the same element and under the same conditions, a `tracking-*` utility follows that recipe and can override its spacing. For a literal length, use a native declaration such as `(letter-spacing:-.03em)`.'
      ],
      links: [{ label: 'Leading', href: '/reference/tokens/leading#inherited-ratio' }, { label: 'Text treatment companions', href: '/reference/tokens/text#primary-and-companions' }, { label: 'native tracking behavior', href: 'https://www.w3.org/TR/css-text-3/#letter-spacing-property' }],
    },
    usage: {
      lead: 'Compare the same phrase at one font size with two tracking values.',
      html: '<div class="grid gap-md leading-md fg-text-body">\n  <p class="m(0) font-lg tracking-tight">Letter spacing shapes this line.</p>\n  <p class="m(0) font-lg tracking-widest">Letter spacing shapes this line.</p>\n</div>',
      keep: ['font-lg'],
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
    summary: 'Animation shorthands, duration values and easing curves.',
    groups: [
      { namespace: 'animate', title: 'Animations', placeholder: 'animation', prefix: 'animate' },
      { namespace: 'duration', title: 'Durations', placeholder: 'duration', prefix: 'transition' },
      { namespace: 'easing', title: 'Easing', placeholder: 'easing', prefix: 'transition' },
    ],
    note: 'The `animation-` and `transition-` prefixes each read both duration and easing namespaces. Custom keys must be distinct across those two namespaces; a shared key is ambiguous. `animate-` reads a complete animation shorthand instead.',
    valuesLead: 'The ten animation tokens include their keyframe names and repeat infinitely. Seven durations supply time lengths; nine easing curves map time progress to value progress. The visual comparisons run animations once, start paused and respect reduced motion.',
    explanation: {
      id: 'duration-overrides', title: 'Override one part of an animation', illustration: 'motion-duration-override',
      paragraphs: [
        '`animate-pulse` writes the complete `animation` shorthand, including its 1s duration. Under the same conditions, `animation-slow` sorts after the shorthand and replaces that duration with 300ms. The keyframe name and iteration count remain unchanged; reordering the class attribute does not change this result.',
        'Use the duration or easing family to adjust one part, or compose a custom animation token from their variables. An explicit native declaration such as `(animation-duration:450ms)` supplies a literal override. The two bars show one iteration on the same time scale; they do not compare rendering performance.',
        'Animation tokens retain the keyframes their values reference. Duration or easing classes alone do not name an animation. A transition also needs a property value to change; `transition-fast` supplies a duration, not a hover state or a property list.',
        'A delay changes when an effect starts; it does not lengthen its duration. Easing changes progress within the duration. Curves with control points outside the vertical 0–1 range can overshoot or rewind; the property being animated can still constrain its rendered values.',
        'Guard nonessential motion with `@motion-safe`. For one run of a preset animation, add `(animation-iteration-count:1)` under the same conditions. Theme Guide owns composing an entrance for a component; View transitions Guide owns transitions between captured page states.'
      ],
      links: [{ label: 'generated rule order', href: '/reference/rules/layers' }, { label: 'native animation shorthand', href: 'https://www.w3.org/TR/css-animations-1/#animation' }, { label: 'View transitions', href: '/guide/view-transitions' }],
    },
    usage: {
      lead: 'Ease the link’s background change on hover when motion is allowed. The link returns to the value tables.',
      html: '<a href="#values" class="inline-block px-md py-xs r-md b(1) b-solid b-line-control bg-surface-raised text-sm fg-text-strong (text-decoration:none) (transition-property:background-color) transition-fast@motion-safe transition-smooth@motion-safe bg-surface-inset:hover">View motion values</a>',
      keep: ['(transition-property:background-color)', 'bg-surface-inset:hover'],
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
    explanation: {
      id: 'tracks-and-flow', title: 'Track counts and placement have different owners', illustration: 'grid-track-flow',
      paragraphs: [
        '`grid-cols(3)` sets `display: grid` and three `minmax(0, 1fr)` columns. `grid-rows(3)` sets three such rows and also sets `grid-auto-flow: column`. With otherwise default placement, the same six children therefore fill across in the first case and down in the second.',
        'Use positive integers for track counts and spans. Track functions do not add a gap. Equal fractions divide the available space after gaps; a zero minimum lets tracks shrink, but does not itself wrap or clip their contents.',
        '`grid-col-span(2)` and `grid-row-span(2)` set an item’s placement, not its parent’s display. A span can create implicit tracks if it exceeds the explicit grid. Layout Guide owns coordinating counts and spans across breakpoints.',
        '`grid-cols()` does not reset the column flow established by `grid-rows()`. If both apply, both track definitions remain and auto-placement still runs down columns. Add `(grid-auto-flow:row)` when you explicitly want row flow.',
        'Row fractions need a constrained available height to divide a fixed vertical space. In an auto-height grid, content participates in row sizing; `grid-rows(3)` is not a height constraint.'
      ],
      links: [{ label: 'Layout', href: '/guide/layout-system#build-column-grids' }, { label: 'native grid placement', href: 'https://www.w3.org/TR/css-grid-2/#auto-placement-algo' }],
    },
    usage: {
      lead: 'Lay out three equal columns and let a feature span two columns and two rows.',
      html: '<div class="grid-cols(3) gap-xs wrap-anywhere">\n  <div class="grid-col-span(2) grid-row-span(2) flex items-end p(8) r-md bg-surface-raised b(1) b-solid b-line-divider text-sm fg-text-strong">Feature</div>\n  <div class="p(8) r-md b(1) b-solid b-line-divider text-sm fg-text-body">Notes</div>\n  <div class="p(8) r-md b(1) b-solid b-line-divider text-sm fg-text-body">Drafts</div>\n  <div class="p(8) r-md b(1) b-solid b-line-divider text-sm fg-text-body">Archive</div>\n  <div class="p(8) r-md b(1) b-solid b-line-divider text-sm fg-text-body">Shared</div>\n  <div class="p(8) r-md b(1) b-solid b-line-divider text-sm fg-text-body">Trash</div>\n</div>',
      keep: ['gap-xs'],
    },
    guide: { label: 'Layout', href: '/guide/layout-system#build-column-grids' },
  },
  {
    id: 'truncation',
    title: 'Truncation',
    summary: 'Clip text to one line or a number of lines and end it with an ellipsis.',
    names: ['truncate', 'clamp-lines'],
    note: 'Both need a constrained width. Inside a flex or grid item, give that item `min-w(0)` so it can shrink.',
    explanation: {
      id: 'visible-lines', title: 'Limit the visible text, keep access to the full text', illustration: 'truncation-lines',
      paragraphs: [
        '`truncate` combines hidden overflow, an ellipsis and no wrapping. It needs a block container with a finite inline width to overflow; applying it to an unconstrained inline span does not make a one-line preview.',
        '`clamp-lines(2)` uses the prefixed line-clamp combination: `display: -webkit-box`, vertical box orientation, a two-line clamp and hidden overflow. Use a positive integer. It allows wrapping, so do not combine it with `truncate` and its `white-space: nowrap`.',
        'The text stays in the DOM. Clipping is a visual constraint, not a shorter string or a disclosure mechanism. Keep essential information available through a real link or an expandable full-text view; do not rely on a hover-only title.',
        'A flex or grid item’s automatic minimum can keep it wider than the space available. Set `min-w(0)` on the item that must shrink, then constrain the text within it. With line clamping, keep padding on a wrapper so padding does not expose clipped lines.',
        'The recipe owns its display and overflow declarations. Overriding those declarations with `flex`, `grid` or visible overflow can break the clamp. For custom truncation rules, use the native properties explicitly.'
      ],
      links: [{ label: 'native text overflow', href: 'https://www.w3.org/TR/css-overflow-3/#text-overflow' }, { label: 'legacy line clamping', href: 'https://www.w3.org/TR/css-overflow-4/#webkit-line-clamp' }],
    },
    usage: {
      lead: 'Keep a file name on one line and its summary to two. Expand the details to read both in full.',
      html: `<article class="max-w-3xs mx-auto p-md r-lg b(1) b-solid b-line-divider bg-surface-raised wrap-anywhere">\n  <p class="m(0) text-sm fg-text-strong truncate">field-notes-autumn-collection-final-v03.fig</p>\n  <p class="mt-2xs mb(0) text-sm fg-text-muted clamp-lines(2)">${article}</p>\n  <details class="mt-md text-sm fg-text-body"><summary class="(cursor:pointer)">Read full details</summary><p class="mt-sm mb-xs font-mono font-xs">field-notes-autumn-collection-final-v03.fig</p><p class="m(0)">${article}</p></details>\n</article>`,
      keep: ['max-w-3xs'],
    },
    guide: { label: 'Typography', href: '/guide/typography' },
  },
  {
    id: 'sr-only',
    title: 'Screen reader text',
    summary: 'Hide text visually while keeping it in the accessibility tree.',
    names: ['sr-only'],
    note: 'Use this class for text that should remain available to assistive technology. It is not a way to disable an element or remove it from keyboard navigation.',
    explanation: {
      id: 'visual-and-accessible', title: 'Visual clipping and accessible naming are separate', illustration: 'screen-reader-name',
      paragraphs: [
        '`sr-only` takes its element out of normal flow, gives it a 1px box and clips its paint. It does not apply `display: none`, `visibility: hidden` or `aria-hidden`. Text can therefore still contribute to an accessible name.',
        'Put the class on the label text inside a control. Keep the control itself visible and focusable. An icon marked `aria-hidden="true"` stays out of the name, leaving the text to describe the action.',
        'Do not put a focusable control inside an always-clipped region: keyboard users could reach a control they cannot see. A skip link needs its own visible-on-focus styling; the preset does not provide a `not-sr-only` reversal utility.',
        'An ancestor that removes the subtree from the accessibility tree still removes this text. `sr-only` cannot counteract `hidden`, `display: none` or `aria-hidden="true"` on an ancestor. Test the resulting role and name in the actual control.'
      ],
      links: [{ label: 'accessible names', href: 'https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/' }],
    },
    usage: {
      lead: 'Name an icon-only link that opens the utility definition below.',
      html: '<a href="#customize" class="inline-flex items-center justify-center w(40) h(40) r-md b(1) b-solid b-line-control bg-surface-raised text-lg fg-text-strong (text-decoration:none)">\n  <span aria-hidden="true">↓</span>\n  <span class="sr-only">Read the utility definition</span>\n</a>',
    },
    caption: 'The link’s accessible name is “Read the utility definition”; the arrow is excluded from that name.',
  },
  {
    id: 'direct-values',
    title: 'Direct values',
    summary: 'Pass one static number to a length or numeric property.',
    names: ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'mxs', 'mxe', 'my', 'mys', 'mye', 'p', 'pt', 'pr', 'pb', 'pl', 'px', 'pxs', 'pxe', 'py', 'pys', 'pye', 'scroll-m', 'scroll-mt', 'scroll-mr', 'scroll-mb', 'scroll-ml', 'scroll-mx', 'scroll-mxs', 'scroll-mxe', 'scroll-my', 'scroll-mys', 'scroll-mye', 'scroll-p', 'scroll-pt', 'scroll-pr', 'scroll-pb', 'scroll-pl', 'scroll-px', 'scroll-pxs', 'scroll-pxe', 'scroll-py', 'scroll-pys', 'scroll-pye', 'top', 'right', 'bottom', 'left', 'inset', 'ix', 'ixs', 'ixe', 'iy', 'iys', 'iye', 'gap', 'col-gap', 'row-gap', 'border-spacing', 'outline-offset', 'shape-margin', 'translate', 'word-spacing', 'w', 'h', 'size-x', 'size-y', 'min-w', 'min-h', 'min-size-x', 'min-size-y', 'max-w', 'max-h', 'max-size-x', 'max-size-y', 'basis', 'r', 'rtl', 'rtr', 'rbl', 'rbr', 'rss', 'rse', 'res', 'ree', 'b', 'bt', 'br', 'bb', 'bl', 'bx', 'bxs', 'bxe', 'by', 'bys', 'bye', 'outline', 'grow', 'shrink', 'order'],
    primary: ['m', 'p', 'gap', 'w', 'h', 'r', 'b', 'grow', 'shrink', 'order'],
    note: 'Length functions multiply the number by `1px`; `grow()`, `shrink()` and `order()` pass it through. Write a native declaration such as `(margin:1rem)` for other units or dynamic values.',
    explanation: {
      id: 'number-meaning', title: 'The property determines what the number means', illustration: 'direct-number-units',
      paragraphs: [
        '`p(12)` writes `padding: calc(12 * 1px)`, so the number is a pixel count. It is not a spacing-scale key or a multiplier of the theme’s spacing tokens. Decimal numbers such as `p(1.5)` are allowed.',
        '`grow(1)` and `shrink(1)` are unitless flex factors. Growth distributes remaining free space; the figure uses zero bases and no content minimum to isolate the 1:2 ratio. With other bases or minimum sizes, factors alone do not determine final widths. Shrink distribution also accounts for each item’s flex base size.',
        '`order()` emits the number directly, but the CSS property requires an integer. Negative values remain subject to each property’s rules: `m(-4)` is a valid negative margin, while negative padding or a negative flex factor cannot request a negative used value.',
        'Pass one static number only. Units, `var()` and arithmetic expressions belong in native declarations, such as `(padding:var(--panel-space))`. A named shared length belongs in a theme token such as `p-card`.',
        'These functions set their listed declarations only. `b(1)` still needs a border style; `top(4)` needs positioning that accepts an inset; `gap(12)` needs a layout where gaps apply. The table keeps logical and physical properties distinct.'
      ],
      links: [{ label: 'Spacing tokens', href: '/reference/tokens/spacing' }, { label: 'native declarations', href: '/reference/rules/declarations' }, { label: 'flex factors', href: 'https://www.w3.org/TR/css-flexbox-1/#flex-flex-grow-factor' }],
    },
    usage: {
      lead: 'Set exact pixel lengths and let one box take the remaining space.',
      html: '<div class="flex flex-wrap gap(12) items-stretch">\n  <div class="p(12) r(10) b(1) b-solid b-line-divider bg-surface-raised text-sm fg-text-body">Fixed</div>\n  <div class="grow(1) p(12) r(10) b(1) b-dashed b-line-control text-sm fg-text-muted">Grows to fill</div>\n</div>',
      keep: ['flex', 'flex-wrap', 'b-solid', 'b-dashed'],
    },
  },
]
