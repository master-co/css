/** Fixed acceptance queries: names, aliases, properties, examples, tokens, rules and tools. */
export const searchTasks = [
  ['opacity', 'opacity'], ['opacity:.5', 'opacity'], ['padding', 'padding'],
  ['p:', 'padding'], ['px:', 'padding'], ['py:', 'padding'], ['pxs:', 'padding'],
  ['pxe:', 'padding'], ['pys:', 'padding'], ['pye:', 'padding'],
  ['padding-inline-start', 'padding'], ['padding-block', 'padding'], ['padding-right', 'padding'],
  ['p:md|lg', 'padding'], ['按鈕內距', 'padding'], ['行內起點內距', 'padding'],
  ['--spacing-md', 'tokens/spacing'], ['spacing', 'tokens/spacing'],
  ['fg:red:hover@sm', 'rules/conditions'], ['Conditions', 'rules/conditions'],
  ['Variables & modes', 'rules/modes'], ['Cascade layers', 'rules/layers'],
  ['樣式沒生成', 'rules/extraction'], ['@compose', 'directives/compose'],
  ['master-css generate', 'tools/cli/generate'], ['master-css lint', 'tools/cli/lint'],
  ['master-css inspect', 'tools/cli/inspect'], ['mastercss_inspect_class', 'tools/mcp/mastercss_inspect_class'],
  ['createEngine', 'packages/css'], ['@master/css-tooling', 'packages/css-tooling']
] as const
