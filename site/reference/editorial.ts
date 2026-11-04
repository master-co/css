import { referenceText as text } from './copy'
/** Human-authored relationships and task vocabulary; semantics come from public APIs. */
export const ruleSources = [
  { id: 'rules/declarations', title: text("rules/declarations", "title"), source: 'guide/style-declarations/contract.mdx', guide: '/guide/syntax-tutorial#declarations', description: text("rules/declarations", "description"), terms: ['opacity', '(opacity:.5)', 'display', 'block', 'items-center', '(property:value)', 'invalid declaration', 'quoted strings', 'native value'] },
  { id: 'rules/selectors', title: text("rules/selectors", "title"), source: 'guide/state-selectors/contract.mdx', guide: '/guide/syntax-tutorial#states', description: text("rules/selectors", "description"), terms: ['specificity', 'selector target', 'underline:hover>a', ':has()', ':where()'] },
  { id: 'rules/conditions', title: text("rules/conditions", "title"), source: 'guide/conditional-queries/contract.mdx', guide: '/guide/syntax-tutorial#conditions', description: text("rules/conditions", "description"), terms: ['fg-red:hover@sm', 'media query', 'container query', 'supports', 'MASTER_QUERY_REQUIRES_CSS'] },
  { id: 'rules/modes', title: text("rules/modes", "title"), source: 'guide/variable-modes/contract.mdx', guide: '/guide/theme#define-tokens', description: text("rules/modes", "description"), terms: ['inline token', 'static token', 'local theme', 'computed variable', 'inherited alias'] },
  { id: 'rules/layers', title: text("rules/layers", "title"), source: 'guide/cascade-layers/contract.mdx', guide: '/guide/cascade-layers#override-a-component-locally', description: text("rules/layers", "description"), terms: ['cascade priority', 'important layer', 'layer conflict', '@layer(defaults)'] },
  { id: 'rules/extraction', title: text("rules/extraction", "title"), source: 'guide/class-extraction/contract.mdx', guide: '/guide/scanning-and-pruning#keep-complete-classes-in-source', description: text("rules/extraction", "description"), terms: ['樣式沒生成', 'missing CSS', 'dynamic classes', 'source ownership', 'candidate extraction', 'SOURCE_PARSE_ERROR'] }
]

/** Directive pages group contract sections by the at-rules a reader looks up. */
export const directivePages: { id: string, title: string, description: string, sections: string[], terms?: string[] }[] = [
  { id: 'imports', title: text("directives/imports", "title"), description: text("directives/imports", "description"), sections: ['entry-markers', 'reference-context'], terms: ['@import', '@reference'] },
  { id: 'theme', title: text("directives/theme", "title"), description: text("directives/theme", "description"), sections: ['theme-declarations'], terms: ['@theme', 'static', 'inline'] },
  { id: 'queries', title: text("directives/queries", "title"), description: text("directives/queries", "description"), sections: ['query-definitions'], terms: ['@custom-media', '@custom-container', 'named conditions'] },
  { id: 'definitions', title: text("directives/definitions", "title"), description: text("directives/definitions", "description"), sections: ['managed-definitions'], terms: ['@utility', '@mixin', '@apply'] },
  { id: 'scanning', title: text("directives/scanning", "title"), description: text("directives/scanning", "description"), sections: ['source-boundaries', 'candidate-policy'], terms: ['@source', '@safelist', '@blocklist'] },
  { id: 'pruning', title: text("directives/pruning", "title"), description: text("directives/pruning", "description"), sections: ['native-css-preservation'], terms: ['@prune', '@preserve', '@keyframes', '@safelist keyframes'] },
]
