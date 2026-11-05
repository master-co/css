import { readFile } from 'node:fs/promises'
import type { Plugin, ViteDevServer } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import { getScanner } from '../utils/scanner-context'

export default function UsageGraphPlugin(_options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  const sources = new Set<string>()
  const closedEnvironments = new WeakSet<object>()
  let watcher: ViteDevServer['watcher'] | undefined
  return {
    name: 'master-css:usage-graph',
    enforce: 'pre',
    configureServer(server) { watcher = server.watcher },
    apply(_, env) {
      return !env.isSsrBuild
    },
    buildStart() {
      if (this.environment) closedEnvironments.delete(this.environment)
    },
    closeBundle() {
      if (this.environment) closedEnvironments.add(this.environment)
    },
    async transform(code, id) {
      if (id.startsWith('\0')) return
      // A framework can still use a closed SSR child compiler to inspect route exports.
      // The transform may proceed, but its disposed scanner no longer owns any CSS output.
      if (this.environment && closedEnvironments.has(this.environment)) return
      const source = id.split('?')[0]
      // Framework plugins compile these in load; scan the authored file once.
      if (/\.(?:mdx?|vue|svelte|astro)$/.test(source)) {
        if (source !== id) return
        code = await readFile(source, 'utf8')
      }
      sources.add(source)
      const scanner = getScanner(context)
      if (scanner.isModuleAllowed(source)) await scanner.scanModule(source, code)
      else scanner.removeSource(source)
      for (const dependency of scanner.sourcePolicyDependencies) {
        // Dev transform watch files become import-analysis edges in Vite. Ignore
        // files are filesystem policy, including paths that don't exist yet.
        if (watcher) watcher.add(dependency)
        else this.addWatchFile(dependency)
      }
    },
    async watchChange(id, { event }) {
      const scanner = getScanner(context)
      if (event === 'delete') { sources.delete(id.split('?')[0]); scanner.removeSource(id.split('?')[0]) }
      if (scanner.sourcePolicyDependencies.includes(id)) {
        for (const source of sources) {
          if (scanner.isModuleAllowed(source)) await scanner.scanModule(source, await readFile(source, 'utf8'))
          else scanner.removeSource(source)
        }
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler: async (html, { filename, server }) => {
        if (server) return
        await getScanner(context).scanModule(filename, html)
      }
    }
  }
}
