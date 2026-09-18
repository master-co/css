import { createRequire } from 'node:module'

/** Preserve global ownership after the user's single combined-root PostCSS pass. */
export function protectNextGeneratedGlobals(file: string, ast: object, scoped: boolean, knownAnimations: readonly string[] = []) {
  const require = createRequire(import.meta.url)
  const postcss = createRequire(require.resolve('next/package.json'))('postcss')
  const root = postcss.fromJSON(ast)
  const valueParser = createRequire(require.resolve('next/package.json'))('next/dist/compiled/postcss-value-parser')
  const globalAnimations = new Set(knownAnimations)
  root.walkAtRules(/keyframes$/i, (rule: { masterCSSGlobal?: boolean, params: string }) => {
    if (!rule.masterCSSGlobal) return
    const names = valueParser(rule.params).nodes
    if (names.length === 1) globalAnimations.add(names[0].value)
  })
  if (scoped) {
    root.walk((node: { type: string, name?: string, masterCSSGlobal?: boolean, parent?: any, nodes?: any[], selectors?: string[], params?: string }) => {
      if (!node.masterCSSGlobal) return
      if (node.type === 'rule') {
        if (node.parent?.type === 'atrule' && /keyframes$/i.test(node.parent.name)) return
        if (node.nodes?.some(child => child.masterCSSGlobal === false)) throw new Error('PostCSS merged authored and generated-global nodes without preserving selector ownership.')
        node.selectors = node.selectors!.map(selector => `:global(${selector})`)
        node.parent.insertBefore(node, postcss.comment({ text: 'cssmodules-pure-ignore' }))
      } else if (node.type === 'atrule' && /keyframes$/i.test(node.name!)) {
        node.params = `:global(${node.params})`
        node.parent.insertBefore(node, postcss.comment({ text: 'cssmodules-pure-ignore' }))
      }
    })
  }
  const result = root.toResult({ from: file, to: file, map: { inline: false, annotation: false, sourcesContent: true } })
  return { source: result.css, sourceMap: result.map.toString(), globalAnimations: [...globalAnimations], processedGlobals: root.masterCSSProcessedGlobals }
}

/** Animation names Master generated for the entry (preset keyframes); authored `@keyframes` stay Module-owned. */
export function nextGeneratedGlobalAnimations(generatedCSS: string) {
  if (!generatedCSS.includes('@')) return [] as string[]
  const require = createRequire(import.meta.url)
  const nextRequire = createRequire(require.resolve('next/package.json'))
  const postcss = nextRequire('postcss'), valueParser = nextRequire('next/dist/compiled/postcss-value-parser')
  const names = new Set<string>()
  postcss.parse(generatedCSS).walkAtRules(/keyframes$/i, (rule: { params: string }) => {
    const nodes = valueParser(rule.params).nodes
    if (nodes.length === 1) names.add(nodes[0].value)
  })
  return [...names]
}

/** Next identifies animation names first; preserve only its already-marked globals. */
export function nextGlobalAnimationReferences(valueParser: any, names: readonly string[]) {
  const globals = new Set(names)
  return {
    postcssPlugin: 'master-next-global-animation-references',
    Once(root: { walkDecls(pattern: RegExp, visitor: (decl: { value: string }) => void): void }) {
      root.walkDecls(/animation(-name)?$/i, decl => {
        const value = valueParser(decl.value)
        for (let index = 1; index < value.nodes.length; index++) {
          const node = value.nodes[index], before = value.nodes[index - 1]
          if (node.type !== 'function' || node.value !== 'local' || node.nodes.length !== 1
            || before.type !== 'div' || before.value !== ':' || !globals.has(node.nodes[0].value)) continue
          value.nodes[index - 1] = { type: 'space', value: (before.before ?? '') + (before.after ?? '') }
          value.nodes[index] = node.nodes[0]
        }
        decl.value = value.toString()
      })
    }
  }
}
