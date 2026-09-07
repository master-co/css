/** Human-authored relationships and task vocabulary; semantics come from public APIs. */
export const utilityEditorial: Record<string, { terms?: string[]; related?: string[]; guide?: string }> = {
  opacity: { terms: ['transparent', 'translucent', '透明度'], related: ['background-color', 'rules/conditions'], guide: '/guide/colors' },
  padding: { terms: ['button padding', '按鈕內距', '內距', '行內起點內距'], related: ['tokens/spacing', 'rules/conditions', 'margin'], guide: '/guide/spacing' },
  color: { terms: ['foreground', '文字顏色'], related: ['tokens/color', 'rules/modes', 'rules/conditions'], guide: '/guide/colors' }
}

export const ruleSources = [
  { id: 'rules/declarations', title: 'Declarations & values', guide: 'style-declarations', description: 'Class declarations, values, units and native property fallback.' },
  { id: 'rules/selectors', title: 'Selectors', guide: 'state-selectors', description: 'States, combinators, pseudo-elements and selector groups.' },
  { id: 'rules/conditions', title: 'Conditions', guide: 'conditional-queries', description: 'Combine states, breakpoints, modes and conditional CSS.' },
  { id: 'rules/modes', title: 'Variables & modes', guide: 'variables-and-modes', description: 'Variable resolution, namespaces, modes and derived values.' },
  { id: 'rules/layers', title: 'Cascade layers', guide: 'cascade-layers', description: 'Layer ownership, ordering and interactions with native CSS.' },
  { id: 'rules/extraction', title: 'Extraction', guide: 'scanning-latent-classes', description: 'Source boundaries, complete class candidates and validation.', terms: ['樣式沒生成', 'missing CSS', 'dynamic classes'] }
]
