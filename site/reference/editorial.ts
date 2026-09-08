/** Human-authored relationships and task vocabulary; semantics come from public APIs. */
export const utilityEditorial: Record<string, { terms?: string[]; related?: string[]; guide?: string }> = {
  opacity: { terms: ['transparent', 'translucent', '透明度'], related: ['background-color', 'rules/conditions'], guide: '/guide/colors' },
  padding: { terms: ['button padding', '按鈕內距', '內距', '行內起點內距'], related: ['tokens/spacing', 'rules/conditions', 'margin'], guide: '/guide/spacing' },
  color: { terms: ['foreground', '文字顏色'], related: ['tokens/color', 'rules/modes', 'rules/conditions'], guide: '/guide/colors' }
}

export const ruleSources = [
  { id: 'rules/declarations', title: 'Declarations & values', source: 'guide/style-declarations/contract.mdx', guide: '/guide/syntax-tutorial#declarations', description: 'Class declarations, values, units and native property fallback.' },
  { id: 'rules/selectors', title: 'Selectors', source: 'guide/state-selectors/contract.mdx', guide: '/guide/syntax-tutorial#states', description: 'States, combinators, pseudo-elements and selector groups.' },
  { id: 'rules/conditions', title: 'Conditions', source: 'guide/conditional-queries/contract.mdx', guide: '/guide/syntax-tutorial#conditions', description: 'Combine states, breakpoints, modes and conditional CSS.' },
  { id: 'rules/modes', title: 'Variables & modes', source: 'guide/variables-and-modes/contract.mdx', guide: '/guide/variables-and-modes', description: 'Variable resolution, namespaces, modes and derived values.' },
  { id: 'rules/layers', title: 'Cascade layers', source: 'guide/cascade-layers/contract.mdx', guide: '/guide/cascade-layers', description: 'Layer ownership, ordering and interactions with native CSS.' },
  { id: 'rules/extraction', title: 'Extraction', source: 'guide/scanning-latent-classes/contract.mdx', guide: '/guide/scanning-latent-classes', description: 'Source boundaries, complete class candidates and validation.', terms: ['樣式沒生成', 'missing CSS', 'dynamic classes'] }
]
