import { readFile } from 'node:fs/promises'
import type { Plugin, ViteDevServer } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import { getScanner } from '../utils/scanner-context'

export default function UsageGraphPlugin(_options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  const sources = new Set<string>()
  let watcher: ViteDevServer['watcher'] | undefined
  return {
    name: 'master-css:usage-graph',
    enforce: 'pre',
    configureServer(server) { watcher = server.watcher },
    apply(_, env) {
      return !env.isSsrBuild
    },
    async transform(code, id) {
      if (id.startsWith('\0')) return
      const source = id.split('?')[0]
      if (/\.(?:mdx?|vue|svelte)$/.test(source)) {
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
