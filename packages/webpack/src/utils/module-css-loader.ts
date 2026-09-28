import { createRequire } from 'node:module'

/** Let the configured css-loader identify animation names before preserving globals. */
export function preserveCSSLoaderGlobals(source: string, globals: string, loader: string) {
  if (!globals.includes('@keyframes')) return source
  const require = createRequire(loader)
  const postcss = require('postcss'), valueParser = require('postcss-value-parser')
  const localByDefault = require('postcss-modules-local-by-default')
  const names = new Set<string>()
  postcss.parse(globals).walkAtRules(/keyframes$/i, (rule: { params: string }) => {
    const nodes = valueParser(rule.params).nodes
    if (nodes.length === 1) names.add(nodes[0].value)
  })
  const root = postcss.parse(source)
  root.walkDecls(/^(?:-webkit-)?animation(?:-name)?$/i, (decl: { prop: string, value: string }) => {
    // The host owns shorthand keywords and explicit local/global syntax. Only
    // copy the value back; selectors and local keyframes keep their normal pass.
    const probe = postcss([localByDefault({ mode: 'local' })]).process(`.probe{${decl.prop}:${decl.value}}`, { from: undefined }).sync()
    const value = valueParser(probe.root.first.first.value)
    let changed = false
    for (let index = 1; index < value.nodes.length; index++) {
      const node = value.nodes[index], before = value.nodes[index - 1]
      if (node.type !== 'function' || node.value !== 'local' || node.nodes.length !== 1 || before.type !== 'div' || before.value !== ':') continue
      value.nodes[index - 1] = { type: 'space', value: (before.before ?? '') + (before.after ?? '') }
      if (names.has(node.nodes[0].value)) {
        node.value = 'global'
        changed = true
      } else value.nodes[index] = node.nodes[0]
    }
    if (changed) decl.value = value.toString()
  })
  return root.toString()
}
