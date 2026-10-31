/** Human-authored relationships and task vocabulary; semantics come from public APIs. */
export const ruleSources = [
  { id: 'rules/declarations', title: 'Declarations & values', source: 'guide/style-declarations/contract.mdx', guide: '/guide/syntax-tutorial#declarations', description: 'Declaration heads, fixed utilities, values and units.', terms: ['opacity', '(opacity:.5)', 'display', 'block', 'items-center', '(property:value)'] },
  { id: 'rules/selectors', title: 'Selectors', source: 'guide/state-selectors/contract.mdx', guide: '/guide/syntax-tutorial#states', description: 'States, combinators, pseudo-elements and selector groups.' },
  { id: 'rules/conditions', title: 'Conditions', source: 'guide/conditional-queries/contract.mdx', guide: '/guide/syntax-tutorial#conditions', description: 'Combine states, breakpoints, modes and conditional CSS.' },
  { id: 'rules/modes', title: 'Variables & modes', source: 'guide/variable-modes/contract.mdx', guide: '/guide/theme#define-tokens', description: 'Variable resolution, namespaces, modes and derived values.' },
  { id: 'rules/layers', title: 'Cascade layers', source: 'guide/cascade-layers/contract.mdx', guide: '/guide/cascade-layers#override-a-component-locally', description: 'Layer ownership, ordering and interactions with native CSS.' },
  { id: 'rules/extraction', title: 'Extraction', source: 'guide/class-extraction/contract.mdx', guide: '/guide/scanning-and-pruning#keep-complete-classes-in-source', description: 'Source boundaries, complete class candidates and validation.', terms: ['樣式沒生成', 'missing CSS', 'dynamic classes'] }
]

/** Directive pages group contract sections by the at-rules a reader looks up. */
export const directivePages: { id: string, title: string, description: string, sections: string[], terms?: string[] }[] = [
  { id: 'imports', title: 'Imports', description: 'Load the preset and other stylesheets, or reference their tokens and definitions without their CSS.', sections: ['Entry markers', 'Reference context'], terms: ['@import', '@reference'] },
  { id: 'theme', title: 'Theme', description: 'Declare tokens, custom media, keyframes and mixin wrappers.', sections: ['Theme and conditions', 'Conditional blocks'], terms: ['@theme', '@custom-media', '@keyframes'] },
  { id: 'definitions', title: 'Utilities and mixins', description: 'Define on-demand utilities, reusable mixins and layered native styles.', sections: ['Utilities and native styles'], terms: ['@utility', '@mixin', '@apply'] },
  { id: 'scanning', title: 'Scanning', description: 'Include or exclude source files and specific class names.', sections: ['Source boundaries', 'Candidate policy'], terms: ['@source', '@safelist', '@blocklist'] },
  { id: 'pruning', title: 'Native CSS pruning', description: 'Choose whether a stylesheet’s unused native class rules are removed.', sections: ['Native CSS preservation'], terms: ['@prune', '@preserve'] },
]
