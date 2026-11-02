/** Explanatory figures for stylesheet directive contracts; prose and artwork share these labels. */
export const directiveIllustrations = {
  'stylesheet-asset-graph': {
    title: 'The entry is one file in a delivered asset graph',
    alt: 'app.css imports print.css under a print condition. print.css refers to mark.svg. All three files must be published at their referenced URLs.',
    caption: 'Follow the references from the entry to the child stylesheet and then its image. These are separate delivered files; the print qualifier stays on the import. Names are illustrative, not generated filename conventions.',
    labels: { group: 'Publish the connected files together', entry: '/assets/app.css', import: '@import "./print.css" print;', child: '/assets/print.css', image: 'url("./mark.svg")', resource: '/assets/mark.svg', resourceKind: 'Image resource', scope: 'The entry text alone does not deliver its dependencies.' },
    description: [
      'The delivered app.css imports print.css with a print qualifier. The child remains a separate stylesheet, and that qualifier stays on its import.',
      'A declaration in print.css refers to mark.svg relative to the child stylesheet’s delivered URL.',
      'Publish the entry, child stylesheet and image at the URLs their references resolve to. Copying only app.css leaves two dependencies unavailable.',
      'The drawing is a dependency graph, not a request waterfall. Actual generated names and whether an asset remains separate depend on the compilation and host.'
    ]
  },
  'import-reference-output': {
    title: 'Import delivers native rules; reference supplies their definitions',
    alt: 'The same tokens.css file feeds two local compilations using bg-brand. The import output includes its native .card rule; the reference output omits .card but still supplies the token used by bg-brand.',
    caption: 'Both local outputs use bg-brand. An import delivers the native .card rule; a reference only makes definitions available. A locally used token can still emit with either output.',
    labels: { file: 'tokens.css', sourceToken: '@theme { --color-brand: #4f46e5; }', token: '--color-brand: #4f46e5;', native: '.card { color: var(--color-brand); }', left: '@import "./tokens.css";', right: '@reference "./tokens.css";', shared: 'Local consumer: bg-brand', output: 'Delivered CSS', kept: '.card { … }', omitted: 'No native .card rule', generated: '.bg-brand { … }', scope: 'Definition reachability and stylesheet delivery are separate.' },
    description: [
      'tokens.css declares --color-brand in @theme and a native .card rule that reads it. The two local compilations differ only in @import versus @reference.',
      'Both local outputs generate bg-brand and retain its --color-brand dependency.',
      'Only the import output contains .card. The reference does not make that rule a local usage root or publish the referenced stylesheet.',
      'The branches compare compiled outputs, not runtime loading steps. Native overrides also need actual stylesheet delivery.'
    ]
  },
  'theme-modifier-axes': {
    title: 'Static controls retention; inline controls the generated value',
    alt: 'A two-by-two matrix compares ordinary, inline, static and static inline theme blocks. Static retains both declared tokens; inline changes the generated background value from var(--color-brand) to the literal color.',
    caption: 'Each case declares brand and spare; only bg-brand is used. With inline alone, neither token needs a declaration. Adding static retains both without changing the substituted class value.',
    labels: { source: 'Declare brand and spare · use only bg-brand', ordinary: '@theme', inline: '@theme inline', static: '@theme static', both: '@theme static inline', columns: ['Keep var()', 'Substitute value'], rows: ['On demand', 'Always retain'], tokens: ['brand', 'none', 'brand + spare', 'brand + spare'], value: 'var(--color-brand)', literal: '#4f46e5', emitted: 'Emitted tokens', background: 'background-color', scope: 'The same source tokens and class are used in all four compilations.' },
    description: [
      'All four cases declare --color-brand: #4f46e5 and --color-spare: #0d9488. bg-brand is their only consumer; there are no native token references.',
      'Ordinary @theme emits the used brand token and background-color: var(--color-brand). The unused spare token is omitted.',
      '@theme inline substitutes #4f46e5 into the generated declaration. That utility no longer reads either token, so neither token declaration is emitted in this case.',
      '@theme static retains both tokens. @theme static inline also retains both, while the generated background-color remains #4f46e5. Retention and substitution are independent.'
    ]
  },
  'container-condition-expansion': {
    title: 'A named condition expands without choosing the container',
    alt: 'The --dense condition combines a named width condition with a style query. Its use at @container card expands the condition while retaining card as the container name.',
    caption: 'The definition stores the condition. The use site supplies card, the container name. Expanding --dense preserves both the width test and the style test.',
    labels: { definition: 'Definition', width: '@custom-container --md (width >= 28rem);', dense: '@custom-container --dense', expression: '(--md) and style(--density: compact);', use: 'Use site', before: '@container card (--dense)', after: '@container card', expanded: '(width >= 28rem) and style(--density: compact)', body: '{ … }', result: 'Expanded condition', scope: 'card selects the container; --dense names only the condition.' },
    description: [
      '--md defines the width condition (width >= 28rem). --dense combines that reference with style(--density: compact).',
      'The use site @container card (--dense) chooses a container named card.',
      'Expansion produces @container card (width >= 28rem) and style(--density: compact). The container name is unchanged; it does not become part of the definition.',
      'The same condition can be reused with another container name or with the nearest eligible container. The figure shows compile-time substitution, not a DOM tree.'
    ]
  },
  'definition-replacement': {
    title: 'A later definition replaces the whole registration',
    alt: 'Two ordered badge utility definitions lead to one final rule. The first contains red color and padding; the second contains only blue color. The output contains only blue color.',
    caption: 'Both definitions register the same static utility. The second replaces the first, including its padding. This is definition replacement before generation, not two CSS rules competing in the cascade.',
    labels: { first: 'First definition', second: 'Later definition', open: '@utility badge {', color: 'color: red;', padding: 'padding: 1rem;', replacement: 'color: blue;', output: 'Using badge emits', selector: '.badge {', absent: 'No padding declaration', scope: 'Same decoded name · same registration form · whole-body replacement' },
    description: [
      'The first static badge definition contains color: red and padding: 1rem.',
      'The later static badge definition contains only color: blue and replaces the first definition completely.',
      'Using badge generates one rule containing color: blue. The earlier padding and its dependencies do not survive.',
      'Static and functional registrations remain independent. Token patterns replace only the branch with the same prefix and namespace; mixins replace their complete named definition.'
    ]
  },
  'scanning-two-filters': {
    title: 'File selection and candidate selection are different filters',
    alt: 'main.html contributes grid and hidden, while draft.html is excluded before extraction. Safelisting adds block; blocklisting removes hidden. The final candidate set is grid and block.',
    caption: 'Excluding draft.html stops its flex candidate from entering this source scope. Blocklisting hidden removes a candidate after collection; safelisting block adds an explicit candidate.',
    labels: { sources: 'File policy', main: 'main.html', draft: 'draft.html', excludedHint: 'Excluded before extraction', classes: 'grid  hidden', excluded: 'flex', candidates: 'Candidate policy', collected: 'grid  hidden', add: '+ safelist block', remove: '− blocklist hidden', result: 'Eligible candidates', output: 'grid  block', scope: 'A candidate must still match a valid utility before CSS can be generated.' },
    description: [
      '@source includes the HTML files, and @source not excludes draft.html. Only main.html contributes its grid and hidden class strings.',
      '@safelist "block" adds a complete candidate independently of a source file.',
      '@blocklist "hidden" removes that candidate. The resulting eligible set is grid and block; flex never entered this scope.',
      'File and candidate policies are distinct. Eligibility is not proof that an arbitrary class string is valid; normal matching and diagnostics still apply.'
    ]
  },
  'pruning-file-boundary': {
    title: 'A pruning directive stops at its file boundary',
    alt: 'app.css opts into pruning and imports cards.css. Only local is used. The unused local rule is removed; both rules from cards.css remain because that file did not opt in.',
    caption: 'Only local is used in this compilation. app.css opts in; cards.css does not. Importing cards.css does not pass the pruning directive into it.',
    labels: { app: 'app.css', directive: '@prune native;', import: '@import "./cards.css";', local: '.local { … }', unused: '.unused-local { … }', cards: 'cards.css', policy: 'Default preservation', card: '.card { … }', unusedCard: '.unused-card { … }', output: 'Delivered native rules', removed: 'Unused local rule removed', scope: 'Per-file opt-in · no project-wide prune option · only local is used' },
    description: [
      'app.css contains @prune native, imports cards.css, and defines .local and .unused-local. The only used class is local.',
      'Its output keeps .local and removes .unused-local.',
      'cards.css declares neither pruning nor preservation directives. Its default policy keeps both .card and .unused-card, although neither class is used.',
      'A project-wide pruneNativeCSS option can opt project files in separately. @preserve native wins within its own file. This example isolates explicit per-file policy.'
    ]
  }
} as const
