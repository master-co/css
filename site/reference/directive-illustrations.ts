import { referenceText as text } from './copy'
/** Explanatory figures for stylesheet directive contracts; prose and artwork share these labels. */
export const directiveIllustrations = {
  'stylesheet-asset-graph': {
    title: text("illustrations/stylesheet-asset-graph", "title"),
    alt: text("illustrations/stylesheet-asset-graph", "alt"),
    caption: text("illustrations/stylesheet-asset-graph", "caption"),
    labels: { group: 'Publish the connected files together', entry: '/assets/app.css', import: '@import "./print.css" print;', child: '/assets/print.css', image: 'url("./mark.svg")', resource: '/assets/mark.svg', resourceKind: 'Image resource', scope: 'The entry text alone does not deliver its dependencies.' },
    description: [
      text("illustrations/stylesheet-asset-graph", "description-0"),
      text("illustrations/stylesheet-asset-graph", "description-1"),
      text("illustrations/stylesheet-asset-graph", "description-2"),
      text("illustrations/stylesheet-asset-graph", "description-3")
    ]
  },
  'import-reference-output': {
    title: text("illustrations/import-reference-output", "title"),
    alt: text("illustrations/import-reference-output", "alt"),
    caption: text("illustrations/import-reference-output", "caption"),
    labels: { file: 'tokens.css', sourceToken: '@theme { --color-brand: #4f46e5; }', token: '--color-brand: #4f46e5;', native: '.card { color: var(--color-brand); }', left: '@import "./tokens.css";', right: '@reference "./tokens.css";', shared: 'Local consumer: bg-brand', output: 'Delivered CSS', kept: '.card { … }', omitted: 'No native .card rule', generated: '.bg-brand { … }', scope: 'Definition reachability and stylesheet delivery are separate.' },
    description: [
      text("illustrations/import-reference-output", "description-0"),
      text("illustrations/import-reference-output", "description-1"),
      text("illustrations/import-reference-output", "description-2"),
      text("illustrations/import-reference-output", "description-3")
    ]
  },
  'theme-modifier-axes': {
    title: text("illustrations/theme-modifier-axes", "title"),
    alt: text("illustrations/theme-modifier-axes", "alt"),
    caption: text("illustrations/theme-modifier-axes", "caption"),
    labels: { source: 'Declare brand and spare · use only bg-brand', ordinary: '@theme', inline: '@theme inline', static: '@theme static', both: '@theme static inline', columns: ['Keep var()', 'Substitute value'], rows: ['On demand', 'Always retain'], tokens: ['brand', 'none', 'brand + spare', 'brand + spare'], value: 'var(--color-brand)', literal: '#4f46e5', emitted: 'Emitted tokens', background: 'background-color', scope: 'The same source tokens and class are used in all four compilations.' },
    description: [
      text("illustrations/theme-modifier-axes", "description-0"),
      text("illustrations/theme-modifier-axes", "description-1"),
      text("illustrations/theme-modifier-axes", "description-2"),
      text("illustrations/theme-modifier-axes", "description-3")
    ]
  },
  'container-condition-expansion': {
    title: text("illustrations/container-condition-expansion", "title"),
    alt: text("illustrations/container-condition-expansion", "alt"),
    caption: text("illustrations/container-condition-expansion", "caption"),
    labels: { definition: 'Definition', width: '@custom-container --md (width >= 28rem);', dense: '@custom-container --dense', expression: '(--md) and style(--density: compact);', use: 'Use site', before: '@container card (--dense)', after: '@container card', expanded: '(width >= 28rem) and style(--density: compact)', body: '{ … }', result: 'Expanded condition', scope: 'card selects the container; --dense names only the condition.' },
    description: [
      text("illustrations/container-condition-expansion", "description-0"),
      text("illustrations/container-condition-expansion", "description-1"),
      text("illustrations/container-condition-expansion", "description-2"),
      text("illustrations/container-condition-expansion", "description-3")
    ]
  },
  'definition-replacement': {
    title: text("illustrations/definition-replacement", "title"),
    alt: text("illustrations/definition-replacement", "alt"),
    caption: text("illustrations/definition-replacement", "caption"),
    labels: { first: 'First definition', second: 'Later definition', open: '@utility badge {', color: 'color: red;', padding: 'padding: 1rem;', replacement: 'color: blue;', output: 'Using badge emits', selector: '.badge {', absent: 'No padding declaration', scope: 'Same decoded name · same registration form · whole-body replacement' },
    description: [
      text("illustrations/definition-replacement", "description-0"),
      text("illustrations/definition-replacement", "description-1"),
      text("illustrations/definition-replacement", "description-2"),
      text("illustrations/definition-replacement", "description-3")
    ]
  },
  'scanning-two-filters': {
    title: text("illustrations/scanning-two-filters", "title"),
    alt: text("illustrations/scanning-two-filters", "alt"),
    caption: text("illustrations/scanning-two-filters", "caption"),
    labels: { sources: 'File policy', main: 'main.html', draft: 'draft.html', excludedHint: 'Excluded before extraction', classes: 'grid  hidden', excluded: 'flex', candidates: 'Candidate policy', collected: 'grid  hidden', add: '+ safelist block', remove: '− blocklist hidden', result: 'Eligible candidates', output: 'grid  block', scope: 'A candidate must still match a valid utility before CSS can be generated.' },
    description: [
      text("illustrations/scanning-two-filters", "description-0"),
      text("illustrations/scanning-two-filters", "description-1"),
      text("illustrations/scanning-two-filters", "description-2"),
      text("illustrations/scanning-two-filters", "description-3")
    ]
  },
  'pruning-file-boundary': {
    title: text("illustrations/pruning-file-boundary", "title"),
    alt: text("illustrations/pruning-file-boundary", "alt"),
    caption: text("illustrations/pruning-file-boundary", "caption"),
    labels: { app: 'app.css', directive: '@prune native;', import: '@import "./cards.css";', local: '.local { … }', unused: '.unused-local { … }', cards: 'cards.css', policy: 'Default preservation', card: '.card { … }', unusedCard: '.unused-card { … }', output: 'Delivered native rules', removed: 'Unused local rule removed', scope: 'Per-file opt-in · no project-wide prune option · only local is used' },
    description: [
      text("illustrations/pruning-file-boundary", "description-0"),
      text("illustrations/pruning-file-boundary", "description-1"),
      text("illustrations/pruning-file-boundary", "description-2"),
      text("illustrations/pruning-file-boundary", "description-3")
    ]
  }
} as const
