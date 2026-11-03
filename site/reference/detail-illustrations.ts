/** Second expansion: each entry answers a different question from the first batch.
 * The same text is rendered in the article, search and portable Markdown. */
export const detailIllustrations = {
  'border-ingredients': {
    title: 'A line color needs a width and a style',
    alt: 'Three matched boxes add border color, then a two-pixel width, then solid style. Only the third paints a border.',
    caption: 'All boxes start with border-style: none. The specimens share their border-box size; only the listed border declarations change.',
    description: ['b-line-divider supplies border-color, and b(2) supplies border-width. Neither changes a none border style.', 'Adding b-solid allows the 2px border to paint. A border can inherit other authored prerequisites from a component, so inspect the complete style when only a color class is shown.']
  },
  'pill-aspect': {
    title: 'The same pill radius follows the box shape',
    alt: 'A 64 by 64 box becomes a circle while a 192 by 64 box becomes a capsule, both using pill.',
    caption: 'The height stays 64px. pill supplies the radius; the specimen dimensions come from separate sizing declarations.',
    description: ['pill sets a fully rounded border radius without setting width, height or padding.', 'Equal width and height produce a circle. A wider box with the same height produces a capsule, so the class alone does not promise a circle.']
  },
  'manual-wrapper-reach': {
    title: 'An ancestor selector can reach into a light region',
    alt: 'A dark data-theme ancestor contains a light region and a chart. The chart uses a light color scheme but still matches the manual-dark ancestor wrapper.',
    caption: 'The dashed path follows the explicit dark attribute. The nested light boundary changes color-scheme, not the ancestry tested by the selector.',
    description: ['The --manual-dark mixin in this article matches either [data-theme="dark"] or a descendant of that element.', 'A chart inside a nested data-theme="light" region is still a descendant of the outer dark region. Its opacity wrapper therefore matches even while light-dark() values use the local light scheme.', 'Use adaptive tokens for values that should follow the used color scheme; an attribute selector tests exactly the relationship it names.']
  },
  'font-loading-boundary': {
    title: 'A family request still needs an available font face',
    alt: 'One font-family request branches to the requested face when available and to a serif fallback when unavailable.',
    caption: 'The samples illustrate two availability cases, not a measured download timeline. The requested face is illustrated with the loaded Geist file; the fallback uses the browser’s serif face.',
    description: ['A font-family declaration names an ordered preference. It does not download a font by itself.', 'An available matching face can render the text; otherwise the browser tries a later family. Glyph coverage also matters, so different characters in one line can use different fonts.', 'Load web fonts through @font-face or a provider stylesheet and inspect rendered fonts, not only the computed font-family string.']
  },
  'reading-measure': {
    title: 'Changing the text measure changes its line breaks',
    alt: 'The same paragraph, font size and line height wrap into different numbers of lines at 176px and 304px widths.',
    caption: 'Only the content width changes. Both paragraphs use 14px Geist with a 24px line height and grow to fit all their text.',
    description: ['A narrow text measure wraps sooner, making the same paragraph taller. The wider measure keeps more words together on each line.', 'Neither specimen has a fixed height or shortened text. Check the actual paragraph width as well as its font size when assessing a composition.']
  },
  'span-includes-gaps': {
    title: 'A spanning item covers the gap between its tracks',
    alt: 'Three 96px columns have 16px gaps. One item spans the first two columns, giving it a 208px width.',
    caption: 'The 320px grid uses grid-cols(3), gap(16) and grid-col-span(2). Rulers show actual CSS geometry, not an arbitrary scale.',
    description: ['The available width is 320px. Two 16px gaps leave 288px for three equal 96px tracks.', 'An item spanning two tracks covers 96px + 16px + 96px, or 208px. The next 16px gap remains between it and the third track.', 'Changing the column count can change track widths; update related spans at the same breakpoint.']
  },
  'logical-inline-axis': {
    title: 'Inline padding follows the writing mode',
    alt: 'px(16) creates left and right padding in horizontal writing, but top and bottom padding in vertical writing.',
    caption: 'The two square content boxes have the same dimensions. Tinted bands identify the actual 16px padding-inline regions.',
    description: ['px(16) emits padding-inline: calc(16 * 1px). In horizontal-tb, its two insets are on the left and right.', 'In vertical-rl, the inline axis runs vertically, so the same class puts padding on the top and bottom.', 'Master CSS x and y names refer to inline and block axes. Physical t, r, b and l names keep their physical sides.']
  },
  'has-owner-target': {
    title: 'has() tests the child and styles the owner',
    alt: 'Two label controls contain unchecked and checked inputs. Only the checked child makes its enclosing label border blue.',
    caption: 'The class is on the label. The input’s checked state is the test; the label receives border-color.',
    description: ['b-blue-60:has(>input:checked) tests whether the class-bearing element has a checked direct child input.', 'When it matches, the border color changes on the owner label, not on the input. The input is shown inside that same boundary to distinguish the test location from the style target.']
  },
  'where-specificity': {
    title: 'where() and is() can match the same states with different weight',
    alt: 'Two aligned selector decompositions keep the owner’s 0-1-0 contribution. where adds zero; is adds the most specific argument, 1-0-0.',
    caption: 'The figures compare specificity only. Origin, importance and layer precedence are considered earlier in the cascade.',
    description: ['The escaped complete class owner contributes 0-1-0 in both generated selectors.', 'For :where(:hover,#selected), the suffix contributes 0-0-0, so the total is 0-1-0.', 'For :is(:hover,#selected), the ID argument supplies the maximum argument specificity of 1-0-0, giving a total of 1-1-0 even when the hover alternative is the one matching.']
  },
  'pseudo-element-origin': {
    title: 'Generated content belongs to the pseudo-elements',
    alt: 'A single span’s rendered line has an opening quote in before, its text in the middle, and a closing quote in after.',
    caption: 'Quotes are generated by real ::before and ::after content declarations. The three brackets identify parts of one rendered element, not three DOM children.',
    description: ['The span contains the text Keep the interface clear. Its (content:open-quote)::before and (content:close-quote)::after classes supply the visible quote marks.', 'Each declaration targets its pseudo-element. Master CSS does not create separate child elements or add a content declaration just because a pseudo-element suffix is present.']
  },
  'attribute-word-match': {
    title: 'An exact attribute value differs from a word match',
    alt: 'A comparison matrix tests title values css, master css and css-in-js against exact equals and whitespace-word matching.',
    caption: 'Each row tests the same DOM attribute value against two suffixes. A hyphen does not make a whitespace word boundary.',
    description: ['[title=css] matches only the exact value css. [title~=css] matches a whitespace-separated word equal to css.', 'Both selectors match css. Only the word selector matches master css. Neither matches css-in-js.', 'The selectors test attributes; they neither split a class string nor edit the attribute value.']
  },
  'compiled-query-snapshot': {
    title: 'A compiled complement already contains its expanded query',
    alt: 'An authored max-md reference to md becomes a concrete 64rem complement in a compiled manifest. Changing only md to 60rem leaves that existing complement at 64rem.',
    caption: 'This compares two definition-loading stages. It is not the behavior of compiling both authored definitions together.',
    description: ['When --md and --max-md are compiled together, not (--md) expands using the matching minimum definition.', 'A compiled manifest already contains the expanded query. Adding a new --md: 60rem definition does not re-expand the old --max-md complement of 64rem.', 'Redeclare both names in a later configuration fragment when both ranges must move together.']
  },
  'contents-default-vs-empty': {
    title: 'An omitted contents block differs from an empty one',
    alt: 'Three calls to the same mixin show the default grid declaration, no declaration for an explicit empty block, and supplied flex content replacing the default.',
    caption: 'The mixin has @contents { display: grid; }. Braces at the call site distinguish an intentional empty block from an omitted block.',
    description: ['@apply --panel; omits a contents block and uses the display: grid fallback.', '@apply --panel {} supplies an empty block, suppressing the fallback and adding no declaration in this example.', '@apply --panel { display: flex; } supplies its own content in place of the fallback. The two display declarations are not merged.']
  },
  'parameter-known-vs-live': {
    title: 'A static recipe argument is different from a live CSS value',
    alt: 'pair(2rem) expands into two dimensions. pair(var(--size)) is rejected for this two-declaration recipe, while an explicit native width variable reaches browser evaluation.',
    caption: 'The shown pair utility has two declarations. The separate one-parameter, one-declaration symbolic-reference exception does not apply to it.',
    description: ['@utility pair(--size) { width: var(--size); height: var(--size); } accepts the known argument in pair(2rem) and binds it into both declarations.', 'This recipe rejects pair(var(--size)) because its argument is browser-dependent. Use explicit native declaration classes for values that must remain live.', '(width:var(--size)) preserves the variable reference for the browser; it changes width only. Add a separate height declaration when that is also required.']
  },
  'reference-no-roots': {
    title: 'A referenced native rule does not retain its token',
    alt: 'A referenced stylesheet defines a token and a remote rule. With no local consumer neither is delivered; adding a local token consumer delivers the token and local rule only.',
    caption: 'Both cases reference the same file. Only local usage changes. The output excerpt omits the surrounding theme layer.',
    description: ['The referenced file defines --color-accent and .remote { color: var(--color-accent); }. Its undelivered native rule is not a usage root.', 'A reference alone makes the token available without delivering that native rule or retaining the token solely for it.', 'Adding .local { color: var(--color-accent); } retains the token through the local consumer. The output still does not copy .remote.']
  },
  'source-relative-base': {
    title: 'A source path starts at the stylesheet that declares it',
    alt: 'An imported styles/shared.css declares ./views/*.html and points to styles/views, while the application’s working directory is shown separately.',
    caption: 'The tree depicts one filesystem. Importing the stylesheet from apps/shop does not rebase its authored @source pattern onto that app.',
    description: ['The repository contains styles/shared.css and styles/views/card.html. shared.css declares @source "./views/*.html".', 'The relative pattern resolves from styles/shared.css, so it includes styles/views/card.html even when the consuming app runs in apps/shop.', 'The scanner’s separately supplied programmatic cwd option has its own contract; this figure explains the CSS-authored directive.']
  },
  'preserve-wins': {
    title: 'Preserve wins over prune in the same file',
    alt: 'Two reversed directive orders both keep the native widget rule, showing that preserve precedence is independent of textual order.',
    caption: 'Native delivery is enabled in both cases. This policy retains native CSS; it does not safelist unused managed utilities.',
    description: ['When @preserve native and @prune native occur in the same file, preservation wins in either order.', 'The native .widget rule is therefore retained even without a scanned widget class.', 'preserveNativeCSS: false is a separate output switch and can suppress native delivery regardless of either directive.']
  },
  'pruning-global-selectors': {
    title: 'Native pruning leaves classless rules available',
    alt: 'With card used, body and root rules remain along with card; an unused class rule is crossed out.',
    caption: 'The source opts into @prune native. Retained classless selectors still obey ordinary CSS matching and cascade rules.',
    description: ['body and :root have no class selectors, so native pruning preserves their rules.', 'A used .card rule remains; an unused .unused class rule is removed in this example.', 'Native pruning is based on class usage, not a browser analysis of every selector or a guarantee that all retained rules currently match.']
  },
  'lint-overlap-context': {
    title: 'Conflict analysis compares declarations in the same variant scope',
    alt: 'Two margin classes in the same scope occupy one shared cell; margin classes at sm and md occupy separate scope columns.',
    caption: 'Separate query scopes do not mean disjoint browser ranges. At md, both minimum-width queries can match and the cascade still applies.',
    description: ['Two margin declarations in the same selector and condition scope can be diagnosed as a conflict by no-conflicting-classes.', 'The sm and md variants shown here have distinct scopes and are not reported as that same-scope conflict.', 'This is a diagnostic grouping, not a claim that the two media ranges never overlap or that the authored values are automatically good design choices.']
  },
  'preload-is-data': {
    title: 'Preloading fetches the program; runtime startup uses it',
    alt: 'A preload link fetches program bytes into the browser. The runtime later consumes that response and produces rules for connected class usage.',
    caption: 'The diagram shows a runtime-only page with a matching fetch preload. Connector lengths do not measure request duration or startup speed.',
    description: ['A preload with as="fetch" and matching crossorigin starts the program request while the document is parsed.', 'The hint does not execute the engine, inspect DOM classes or generate CSS. Runtime initialization consumes the matching response and performs that work.', 'Do not add this program preload to a progressive page that intentionally defers the engine and program. The page hydration manifest is a different resource.']
  }
} as const

export type DetailIllustrationId = keyof typeof detailIllustrations
