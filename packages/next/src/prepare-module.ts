import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { nextGlobalAnimationReferences } from './prepare-global-module'

export interface ModuleContext {
  importModule?: (request: string) => Promise<{ source: string, sourceMap?: string, ast?: object }>
  _compiler?: { resolverFactory: { get(type: 'loader'): {
    resolve(context: { issuer: string }, directory: string, request: string, resolveContext: object, callback: (error: Error | null, result?: string | false) => void): void
  } } }
  getResolve?: (options: Record<string, unknown>) => (context: string, request: string) => Promise<string>
  context?: string
  resource?: string
  resourcePath: string
  rootContext?: string
  loaders?: { path?: string, request?: string, options?: Record<string, any> }[]
}

/** Delegate CSS Module syntax, purity and naming to Next's own processors. */
export async function prepareNextModule(context: ModuleContext, source: string, projectDir: string, sourceMap?: string, webpack = false, preparation?: { scoped: boolean, retainedImports?: readonly string[], globalAnimations?: readonly string[], resolveICSS(specifier: string): Promise<Record<string, string>> }) {
  if (preparation?.scoped === false && !source.includes(':import') && !source.includes(':export')) return { source, sourceMap, exportsCSS: '', exports: {} as Record<string, string> }
  const require = createRequire(import.meta.url)
  const nextRequire = createRequire(require.resolve('next/package.json'))
  const postcss = nextRequire('postcss')
  const { getModulesPlugins } = nextRequire('next/dist/build/webpack/loaders/css-loader/src/utils')
  const { getCssModuleLocalIdent } = nextRequire('next/dist/build/webpack/config/blocks/css/loaders/getCssModuleLocalIdent')
  const { extractICSS, createICSSRules, replaceSymbols, replaceValueSymbols } = nextRequire('next/dist/compiled/icss-utils')
  const escape = nextRequire('next/dist/compiled/css.escape')
  const host = Object.create(context)
  host.rootContext = context.rootContext ?? projectDir
  host.emitError = (error: Error) => { throw error }
  const loader = context.loaders?.find(loader => loader.path?.endsWith('/webpack-css-loader.js'))
  const configured = loader?.options?.options?.modules ?? {}
  const generated = new Set<string>()
  const getLocalIdent = configured.getLocalIdent ?? getCssModuleLocalIdent
  const options = { modules: {
    mode: 'pure', localIdentContext: host.rootContext, ...configured,
    getLocalIdent(...args: unknown[]) { const name = getLocalIdent(...args); generated.add(name); return name }
  } }
  const plugins = preparation?.scoped === false ? [] : getModulesPlugins(options, host)
  if (preparation?.scoped && preparation.globalAnimations?.length) {
    plugins.splice(plugins.length - 1, 0, nextGlobalAnimationReferences(nextRequire('next/dist/compiled/postcss-value-parser'), preparation.globalAnimations))
  }
  const result = await postcss(plugins).process(source, {
    from: context.resourcePath, to: context.resourcePath,
    map: { inline: false, annotation: false, sourcesContent: true, prev: sourceMap ? JSON.parse(sourceMap) : false }
  })
  const { icssImports, icssExports } = extractICSS(result.root) as { icssImports: Record<string, Record<string, string>>, icssExports: Record<string, string> }
  if (preparation) {
    const replacements: Record<string, string> = {}
    const dependencies: string[] = []
    for (const [specifier, symbols] of Object.entries(icssImports)) {
      const imported = await preparation.resolveICSS(specifier)
      for (const [symbol, exported] of Object.entries(symbols)) {
        if (!(exported in imported)) throw new Error(`Missing CSS Module export ${exported} in ${specifier}`)
        replacements[symbol] = imported[exported]
      }
      dependencies.push(specifier)
      delete icssImports[specifier]
    }
    replaceSymbols(result.root, replacements)
    for (const [name, value] of Object.entries(icssExports)) icssExports[name] = replaceValueSymbols(value, replacements)
    // css-loader includes dependency CSS before the importing file's own rules,
    // after its ordinary @imports. Retain those files in the compiler graph.
    let previous = result.root.nodes.findLast((node: { type: string, name?: string }) => node.type === 'atrule' && node.name === 'import')
    for (const specifier of dependencies.filter(specifier => !preparation.retainedImports?.includes(specifier))) {
      const rule = postcss.atRule({ name: 'import', params: JSON.stringify(specifier) })
      if (previous) result.root.insertAfter(previous, rule)
      else result.root.prepend(rule)
      previous = rule
    }
  }
  const output = result.root.toResult({ from: context.resourcePath, to: context.resourcePath, map: { inline: false, annotation: false, sourcesContent: true } })
  const map = output.map.toJSON()
  map.sources = map.sources.map((file: string) => file.startsWith('<') ? file : new URL(file, pathToFileURL(context.resourcePath)).href)
  let exportsCSS: string
  if (webpack) {
    exportsCSS = createICSSRules(icssImports, icssExports, postcss).map((rule: { toString(): string }) => rule.toString()).join('\n')
  } else {
    // Turbopack ignores ICSS :export. Its native global/dependency compositions
    // carry the pre-scoped names while it owns the public Module exports.
    const rules = []
    const values: Record<string, string> = {}
    for (const [name, value] of Object.entries(icssExports)) {
      const names = value.split(/\s+/).filter(Boolean)
      if (!names.some(name => generated.has(name))) { values[name] = value; continue }
      const rule = postcss.rule({ selector: '.' + escape(name) })
      for (const token of names) {
        const imported = Object.entries(icssImports).find(([, values]) => token in values)
        rule.append(postcss.decl({ prop: 'composes', value: imported
          ? `${escape(imported[1][token])} from ${JSON.stringify(imported[0])}`
          : `${escape(token)} from global` }))
      }
      rules.push(rule)
    }
    rules.push(...createICSSRules(icssImports, values, postcss))
    exportsCSS = rules.map(rule => rule.toString()).join('\n')
  }
  return { source: output.css, sourceMap: JSON.stringify(map), exportsCSS, exports: icssExports }
}
