/** Fixed acceptance queries: names, aliases, properties, examples, tokens, rules and tools. */
export const searchTasks = [
  ['opacity', 'rules/declarations'], ['opacity:.5', 'rules/declarations'], ['padding', 'tokens/families'],
  ['p', 'tokens/families'], ['padding-inline:', 'tokens/families'], ['padding-block:', 'tokens/families'], ['padding-inline-start:', 'tokens/families'],
  ['padding-inline-end:', 'tokens/families'], ['padding-block-start:', 'tokens/families'], ['padding-block-end:', 'tokens/families'],
  ['padding-inline-start', 'tokens/families'], ['padding-block', 'tokens/families'], ['padding-right', 'tokens/families'],
  ['px', 'tokens/families'], ['按鈕內距', 'tokens/families'], ['行內起點內距', 'tokens/families'],
  ['--spacing-md', 'tokens/spacing'], ['spacing', 'tokens/spacing'],
  ['fg-red:hover@sm', 'rules/conditions'], ['Conditions', 'rules/conditions'],
  ['Variables & modes', 'rules/modes'], ['Cascade layers', 'rules/layers'],
  ['樣式沒生成', 'rules/extraction'], ['text-gradient', 'text-gradient'],
  ['master-css generate', 'tools/cli/generate'], ['master-css lint', 'tools/cli/lint'],
  ['master-css inspect', 'tools/cli/inspect'], ['mastercss_inspect_class', 'tools/mcp/mastercss_inspect_class'],
  ['createEngine', 'packages/css'], ['@master/css-tooling', 'packages/css-tooling']
] as const
