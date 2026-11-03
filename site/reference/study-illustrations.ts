import { detailIllustrations } from './detail-illustrations'

/** Additional lessons, ordered by teaching priority in the accompanying QA inventory.
 * Each description is also the independent HTML, search and Markdown equivalent. */
export const studyIllustrations = {
  ...detailIllustrations,
  'suffix-ownership': {
    title: 'A suffix belongs to one complete class',
    alt: 'Anatomy of p(12):hover@sm! beside a separate rounded-corner class.',
    caption: 'The brackets attach to exact character ranges. The space ends the first class; its state, condition and importance do not extend to r-md.',
    description: ['p(12) supplies padding. :hover tests the class-bearing element, @sm limits the rule to the named media condition, and the final ! marks its declaration important.', 'The separate r-md class has none of those suffixes. It can apply without hover or the sm condition and its declaration is not important.']
  },
  'padding-coverage': {
    title: 'A side override changes only that side',
    alt: 'Two equal content boxes compare p(24) with p(24) pt(8). Only the top inset shrinks from 24px to 8px.',
    caption: 'The bands are inspection guides, not generated background colors. Both specimens use real preset CSS and identical content dimensions.',
    description: ['p(24) gives the content 24px of padding on all four sides.', 'Adding pt(8) changes the top padding to 8px. The other three sides remain 24px, independent of the order of the two HTML classes under the same conditions.']
  },
  'fixed-name-reservation': {
    title: 'A fixed spelling keeps its own definition',
    alt: 'w-full fills a parent while an explicit native width declaration reads a custom 12rem container-full token and sizes an otherwise identical child.',
    caption: 'Both parents are 240px wide. The custom --container-full is 12rem (192px at a 16px root); w-full remains the fixed 100% utility.',
    description: ['The configuration defines @theme { --container-full: 12rem; }. The preset already registers the complete fixed name w-full with width: 100%.', 'w-full therefore fills the 240px parent. The explicit (width:var(--container-full)) class reads --container-full and gives the second block a 192px width.', 'The token remains available through an explicit var() reference; defining it does not replace the fixed w-full registration.']
  },
  'important-recipe': {
    title: 'Importance covers every declaration in the recipe',
    alt: 'The final exclamation mark in text-sm! connects to important markers on font-size, line-height and letter-spacing.',
    caption: 'One final ! marks all three declarations; ellipses omit their token references. It does not mark nearby HTML classes or the theme token definitions important.',
    description: ['text-sm writes font-size, line-height and letter-spacing using its primary token and companion references.', 'text-sm! marks all three generated declarations !important. The dependency declarations remain ordinary theme tokens.']
  },
  'descendant-depth': {
    title: 'A child selector stops at the first level',
    alt: 'Two matching DOM trees show underline>a reaching a direct link, while underline_a also reaches a link nested inside a section.',
    caption: 'The trees have identical structure. Underlining marks the actual target links; indentation and connecting branches show their depth.',
    description: ['The class-bearing article contains link A and a section containing link B.', 'underline>a underlines only direct child link A. underline_a underlines both A and B because both are descendant links.', 'The declarations target those links directly; the diagram does not represent inherited text decoration from the article.']
  },
  'sibling-direction': {
    title: 'Sibling selectors look forward from the owner',
    alt: 'Two identical sibling rows compare the next link selected by +a with both later links selected by ~a. An earlier link stays unselected.',
    caption: 'Every node in a row has the same parent. The outlined owner carries the class; underlines identify the selected links.',
    description: ['The sibling order is link A, the class-bearing element, link B and link C.', 'underline+a selects B, the next element sibling. underline~a selects B and C, the later sibling links.', 'Neither selector selects earlier sibling A. If the next element were not a link, +a would select nothing.']
  },
  'selector-list-branches': {
    title: 'A selector list restarts at the class owner',
    alt: 'Two branches from one class owner end at hover and focus-visible, both leading to the same underline declaration.',
    caption: 'The comma separates alternatives. Each selector starts from the class-bearing element; either state can match.',
    description: ['underline:hover,:focus-visible generates a selector list with the complete escaped class owner repeated in each branch.', 'Hover and focus-visible are alternatives, not a requirement to match both states. The declaration is shared by the two branches.']
  },
  'breakpoint-partition': {
    title: 'The minimum and its complement meet without overlap',
    alt: 'Two aligned number-line intervals meet at 64rem. max-md has an open endpoint; md has a filled endpoint.',
    caption: 'The dots show excluded and included boundaries. The axis is a local view around the preset md threshold, not a device-size chart.',
    description: ['The preset @md begins at width >= 64rem. @max-md is its complement and excludes that exact threshold.', 'At 63.999rem only max-md matches; at 64rem only md matches. There is no gap or overlapping boundary.', 'If replacing an already-expanded manifest definition, redeclare its complement too; changing one compiled definition does not re-expand the other.']
  },
  'condition-eligibility': {
    title: 'Matching a query makes a rule eligible',
    alt: 'The same compiled media rule is connected to two viewport cases. Below the threshold it is inactive; at the threshold it enters the cascade.',
    caption: 'The compiler emits the query before either browser case is evaluated. Matching the query does not guarantee winning the cascade.',
    description: ['grid@media(width>=40rem) emits an @media rule containing display: grid without testing a current viewport.', 'At 39rem the browser does not apply that rule. At 40rem the condition matches and the declaration participates in the cascade.', 'Other cascade rules can still determine the final display value. Compilation, query matching and the final computed style are distinct checks.']
  },
  'token-dependency-chain': {
    title: 'A used token brings its dependencies',
    alt: 'fg-action reaches color-action and then color-brand. A separate color-unused token has no connection to that chain.',
    caption: 'Arrows mean “references”, not execution or cascade priority. This example has no static tokens, safelists or other consumers.',
    description: ['The theme defines --color-action: var(--color-brand), --color-brand: #175cff and an unrelated --color-unused.', 'Using fg-action retains --color-action and its transitive dependency --color-brand in the theme layer.', 'The unrelated token has no usage root in this example and is not emitted. The generated color declaration keeps var(--color-action); the browser resolves its value.']
  },
  'registration-boundary': {
    title: 'A native variable does not register a token class',
    alt: 'The same spacing-card declaration is shown inside theme and inside root. Only the theme definition connects to p-card; both can supply an explicit native var reference.',
    caption: 'Both examples load the preset utility families. Registration and browser variable availability are separate capabilities.',
    description: ['@theme { --spacing-card: 1.5rem; } registers the card key in the spacing namespace, making p-card available.', ':root { --spacing-card: 1.5rem; } supplies a native CSS variable but does not register p-card.', 'The explicit native class (padding:var(--spacing-card)) can use the variable from either configuration.']
  },
  'layer-token-separation': {
    title: 'Selecting a style layer does not move its token',
    alt: 'p-md@layer(defaults) maps to a padding rule in defaults, while its spacing-md dependency remains in theme.',
    caption: 'The two layer bands show output ownership. Their positions are not a complete cascade comparison.',
    description: ['p-md@layer(defaults) emits the generated padding declaration in the defaults layer.', 'Its --spacing-md dependency still emits under :root,:host in the theme layer. @layer(defaults) selects the class rule’s layer, not its dependency’s layer.']
  },
  'mixin-splice': {
    title: 'A mixin expands at the call position',
    alt: 'A highlighted apply line in a native caption rule is replaced by two highlighted declarations, between the unchanged color and font-weight lines.',
    caption: 'Matching lines stay aligned around the insertion. The selector, declaration order and surrounding layer remain the caller’s.',
    description: ['The --caption mixin supplies font-size: 14px and line-height: 1.5.', 'Inside .caption, @apply --caption expands between color: currentColor and font-weight: 600.', 'Expansion does not register a class or move the native rule to a generated layer. Duplicate declarations and authored order are preserved.']
  },
  'contents-insertion': {
    title: 'The wrapper places the caller’s declarations',
    alt: 'The contents slot inside an is-hover-or-focus-visible selector is filled with text-decoration-line: underline from an underline class.',
    caption: 'The highlighted slot and inserted declaration share one position inside the selector boundary. The wrapper controls where the declaration applies.',
    description: ['@mixin --hocus { &:is(:hover, :focus-visible) { @contents; } } defines a selector wrapper with an explicit contents slot.', 'underline@apply(--hocus) supplies text-decoration-line: underline to that slot. The emitted rule matches the class owner in either state.', 'The visual result abbreviates the escaped class owner as & to keep the placement readable; the generated CSS retains the full owner.']
  },
  'independent-registrations': {
    title: 'A static name and a function are separate registrations',
    alt: 'Two independent lanes connect badge to a display definition and badge(8px) to a padding function. A replacement on the static lane does not cross into the function lane.',
    caption: 'The lanes encode registration identity. Equal names do not make the two definitions overloads or a merged body.',
    description: ['@utility badge { display: inline-block; } registers the static badge class. @utility badge(--inset) { padding: var(--inset); } registers a separate function.', 'Replacing the static definition with display: block changes badge, while badge(8px) still writes padding: 8px.', 'Replacement affects the complete body of the same form and name. The function is not a fallback for the static class.']
  },
  'ambiguous-namespace': {
    title: 'Two matching namespaces do not produce two declarations',
    alt: 'font-brand reaches two matching brand keys, one in font-family and one in font-size. The branches meet at an ambiguity barrier with no emitted rule.',
    caption: 'Both token keys exist in this custom theme. Master CSS requires a unique namespace selection before generating the class.',
    description: ['With --font-family-brand: monospace and --font-size-brand: 2rem, font-brand matches two preset font- families.', 'The result is AMBIGUOUS_TOKEN and no CSS for that class; the branches are not combined.', 'Use distinct keys or an explicit native declaration such as (font-size:var(--font-size-brand)).']
  },
  'keyframe-reachability': {
    title: 'An animation name can retain a definition without a class',
    alt: 'A keyframe safelist points directly to a reveal definition. The delivered output contains keyframes, with no animation declaration or class rule.',
    caption: 'The file opts into @prune native. A keyframe safelist retains a resource; it does not start an animation.',
    description: ['In a file with @prune native, @safelist keyframes "reveal" retains the matching @keyframes reveal definition.', 'The output contains the keyframe definition but no generated class or animation declaration solely because of this safelist.', 'Another native declaration or script must select the animation. Without that use, retaining the definition alone has no visible animation effect.']
  },
  'pruning-selector-branches': {
    title: 'Pruning keeps branches by class usage',
    alt: 'A selector list loses unused:hover but keeps card. A separate card title descendant selector stays whole when card is used, even without evidence of a matching DOM relationship.',
    caption: 'The retained highlight follows selector branches. Pruning checks used class names, not whether the complete selector currently matches an element.',
    description: ['With @prune native and card used, .card, .unused:hover keeps only its .card branch.', 'The separate .card .title branch is retained because card appears in the used set; title need not also be found.', 'Retention does not prove that the DOM contains a title descendant. Rules without class selectors remain preserved.']
  },
  'static-branch-extraction': {
    title: 'Static alternatives are visible before a branch runs',
    alt: 'Both literal arms of a conditional expression connect to extracted classes. A concatenation with a runtime tone ends at an unresolved fragment.',
    caption: 'The two branches are source alternatives, not executed steps. Extraction neither predicts the chosen branch nor invents a concatenated class name.',
    description: ['error ? "bg-red-60" : "bg-green-60" exposes both complete static class strings to extraction.', '"bg-" + tone does not expose a complete resulting class. The scanner does not infer the value of tone.', 'Use complete alternatives for bounded choices, or a stable class with a dynamic CSS variable when the value itself is unbounded.']
  },
  'source-replacement': {
    title: 'Updating a source replaces its contribution',
    alt: 'Before and after sets for one page share r-md. p-sm leaves and p-lg enters when that page is rescanned.',
    caption: 'The repeated filename identifies one source. This example has no other sources or safelists retaining the old class.',
    description: ['Initially card.html contributes p-sm and r-md. Its next content contributes p-lg and r-md.', 'Rescanning the same source replaces its contribution: r-md remains, p-lg is added and p-sm is released.', 'Another current source or safelist could still retain p-sm. Source updates do not accumulate all historically seen classes.']
  }
} as const

export type StudyIllustrationId = keyof typeof studyIllustrations
