import { resolve } from 'node:path'
import { STYLE_ENTRY_COVERAGE_PLUGIN, type StyleEntryCoverageAPI } from '@master/css-internal/style-module'

interface KitOptions {
  files?: { routes?: string }
  outDir?: string
  extensions?: readonly string[]
  output?: { bundleStrategy?: string }
  router?: { resolution?: string }
}

const absoluteID = (root: string, path: string) => resolve(root, path).replace(/\\/g, '/')

const coverage: StyleEntryCoverageAPI = {
  coveredRoots({ config, environment, input, getModule, withEntry }) {
    const api = config.plugins.find(plugin => plugin.name === 'vite-plugin-sveltekit-setup')?.api as { options?: KitOptions } | undefined
    const kit = api?.options
    if (!kit?.files?.routes || !kit.outDir || !kit.extensions?.length || kit.output?.bundleStrategy !== 'split') return []
    if (!input || typeof input !== 'object' || Array.isArray(input)) return []
    const inputs = new Map(Object.entries(input).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([name, file]) => [name, absoluteID(config.root, file)]))
    const seen = new Set<string>(), repeated = new Set<string>()
    for (const id of inputs.values()) {
      if (seen.has(id)) repeated.add(id)
      seen.add(id)
    }

    const routes = absoluteID(config.root, kit.files.routes)
    const out = absoluteID(config.root, kit.outDir)
    const rootLayout = kit.extensions.map(extension => `${routes}/+layout${extension}`)
      .find(id => withEntry.has(id))
    if (!rootLayout) return []

    if (environment === 'client') {
      const client = `${out}/generated/build/client-optimized`
      const app = `${client}/app.js`
      const nodes = `${client}/nodes`
      const root = `${nodes}/0.js`
      if (inputs.get('entry/app') !== app || inputs.get('nodes/0') !== root || !withEntry.has(root)) return []

      // Split Kit builds use separate node inputs, then apply node zero to the
      // whole route tree. A node imported by another consumer must keep its CSS.
      return [...inputs].flatMap(([name, id]) => {
        const match = /^nodes\/(\d+)$/.exec(name)
        if (!match || id !== `${nodes}/${match[1]}.js` || repeated.has(id)) return []
        const module = getModule(id)
        if (!module?.isEntry || module.importers.length || module.dynamicImporters.some(importer => importer !== app)) return []
        if (!module.dynamicImporters.includes(app) && kit.router?.resolution !== 'server') return []
        return [id]
      })
    }

    if (environment === 'ssr') {
      if (inputs.get(`entries/pages/${rootLayout.slice(routes.length + 1)}`) !== rootLayout) return []
      // Kit lists route components as independent SSR inputs. The server uses
      // their CSS together in the route branch even when the browser skips CSR.
      return [...inputs].flatMap(([name, id]) => {
        if (!name.startsWith('entries/pages/')) return []
        const relative = name.slice('entries/pages/'.length)
        const file = relative.split('/').at(-1)
        if (id !== `${routes}/${relative}` || repeated.has(id) ||
          !kit.extensions?.some(extension => file?.endsWith(extension) && /^\+(page|layout|error)(@|\.|$)/.test(file))) return []
        const module = getModule(id)
        return module?.isEntry && !module.importers.length && !module.dynamicImporters.length ? [id] : []
      })
    }
    return []
  }
}

export function svelteKitStyleEntryCoverage() {
  return { name: STYLE_ENTRY_COVERAGE_PLUGIN, apply: 'build' as const, api: coverage }
}
