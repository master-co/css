import { isAbsolute } from 'node:path'
import { installSassProxyAccessCheck } from '../utils/sass-proxy-access'
import type { Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import { getScanner } from '../utils/scanner-context'
import { clearBuildSassSources, invalidatePreparedSassSources, getSassSourceFile, prepareBuildSassSource, sassSourceID, sassModuleID, isSassModuleID, isRawStyleRequest } from '../utils/build-sass-source'

/** Sass and CSS Modules enter the CSS pipeline after host preprocessing. */
export default function SassSourcePlugin(context: MasterCSSVitePluginContext): Plugin {
  let stylesheetURLs = new Map<string, Set<string>>()
  let pendingStylesheetURLs = new Set<Promise<void>>()
  return {
    name: 'master-css:sass-source',
    enforce: 'pre',
    buildStart() { if (context.config?.command !== 'serve') clearBuildSassSources(context) },
    configureServer(server) {
      installSassProxyAccessCheck(server)
      clearBuildSassSources(context)
      const serverStylesheetURLs = new Map<string, Set<string>>()
      const serverPendingURLs = new Set<Promise<void>>()
      stylesheetURLs = serverStylesheetURLs
      pendingStylesheetURLs = serverPendingURLs
      server.middlewares.use((request, response, next) => {
        const requestURL = request.url
        if (!requestURL || !request.headers.accept?.includes('text/css')) return next()
        const url = new URL(requestURL, 'http://master-css.invalid')
        const base = server.config.base
        if (base !== '/' && url.pathname.startsWith(base)) url.pathname = '/' + url.pathname.slice(base.length)
        const servedPath = url.pathname
        if (!/\.(?:css|scss|sass)$/.test(servedPath)) return next()
        response.once('finish', () => {
          if (response.statusCode !== 200) return
          // Vite adds ?direct for CSS responses and may normalize a Sass URL to
          // .scss.css when its resolved id is our preprocessed CSS proxy.
          let graphURL: string
          try { graphURL = decodeURI(url.pathname) + url.search + (url.searchParams.has('direct') ? '' : url.search ? '&direct' : '?direct') } catch { return }
          const registration: Promise<void> = server.moduleGraph.getModuleByUrl(graphURL).then(module => {
            const owner = module?.id && getSassSourceFile(module.id)
            if (!owner) return
            let urls = serverStylesheetURLs.get(owner)
            if (!urls) { urls = new Set(); serverStylesheetURLs.set(owner, urls) }
            urls.add(servedPath)
          }).catch(error => server.config.logger.warn(`[master-css] Could not track stylesheet URL ${servedPath}: ${String(error)}`))
            .finally(() => { serverPendingURLs.delete(registration) })
          serverPendingURLs.add(registration)
        })
        next()
      })
    },
    async hotUpdate({ file, modules, timestamp }) {
      const { moduleGraph, hot } = this.environment
      const urls = stylesheetURLs
      await Promise.all(pendingStylesheetURLs)
      const owners = new Set(invalidatePreparedSassSources(context, file))
      // Vite also associates retained CSS/resource dependencies with their
      // transformed owner. They are discovered after Sass preprocessing, so
      // its cache alone cannot identify attached stylesheet URLs to update.
      const pending = new Set(modules)
      for (const module of pending) {
        const owner = getSassSourceFile(module.id ?? '')
        if (owner) owners.add(owner)
        else for (const importer of module.importers) pending.add(importer)
      }
      if (!owners.size) return
      const affected = new Set(modules)
      for (const module of moduleGraph.idToModuleMap.values()) {
        const owner = getSassSourceFile(module.id ?? '')
        if (!owner || !owners.has(owner)) continue
        moduleGraph.invalidateModule(module)
        affected.add(module)
      }
      const paths = new Set([...owners].flatMap(owner => [...urls.get(owner) ?? []]))
      if (paths.size && this.environment.config.consumer === 'client') hot.send({ type: 'update', updates: [...paths].map(path => ({ type: 'css-update', path, acceptedPath: path, timestamp })) })
      return [...affected]
    },
    shouldTransformCachedModule({ id }) {
      if (isSassModuleID(id)) return true
    },
    async transform(code, id) {
      if (!isSassModuleID(id)) return
      // The host-generated exports carry scoped names unavailable in authored
      // JS. Use the normal scanner under a source-like, file-owned identity.
      await getScanner(context).scanModule(`${getSassSourceFile(id)}.js`, code)
    },
    async resolveId(id, importer) {
      const proxyOwner = getSassSourceFile(id)
      if (proxyOwner) {
        if (context.config?.command !== 'serve' || isSassModuleID(id)) return id
        // A browser-facing proxy URL is root-relative (or /@fs/), whereas a
        // prepared source needs Vite's canonical filesystem owner.
        const query = id.slice(sassSourceID(proxyOwner).length)
        const resolved = await this.resolve(proxyOwner + query, importer, { skipSelf: true })
        if (!resolved || resolved.external) return resolved
        const file = resolved.id.replace(/[?#].*$/, '')
        if (!isAbsolute(file)) return
        return { ...resolved, id: sassSourceID(file) + resolved.id.slice(file.length) }
      }
      const stylesheetURL = context.config?.command === 'build'
        && /[?&]url(?:[=&]|$)/.test(id) && !/[?&]raw(?:[=&]|$)/.test(id)
        && /\.(?:scss|sass)(?:[?#].*)?$/.test(id) && !/\.module\.(?:scss|sass)(?:[?#].*)?$/.test(id)
      // Resolve URL requests before Vite records its CSS URL token identity.
      // Keep raw requests and Vite's unsupported Modules URL contract intact.
      if (isRawStyleRequest(id) && !stylesheetURL) return
      const cssModule = /\.module\.css(?:[?#].*)?$/.test(id) && context.config?.css.modules !== false
      if (!cssModule && !/\.(?:scss|sass)(?:[?#].*)?$/.test(id)) return
      const resolved = await this.resolve(id, importer, { skipSelf: true })
      if (!resolved || resolved.external) return
      const file = resolved.id.replace(/[?#].*$/, '')
      if (!isAbsolute(file)) return
      const query = resolved.id.slice(file.length)
      const modules = /\.module\.(?:css|scss|sass)$/.test(file) && context.config?.css.modules !== false && !/[?&]inline(?:[=&]|$)/.test(query)
      return { ...resolved, id: (modules ? sassModuleID(file) : sassSourceID(file)) + query }
    },
    async load(id) {
      // Vite owns the URL module; its transform-only child loads prepared CSS.
      if (isRawStyleRequest(id)) return
      const file = getSassSourceFile(id)
      if (!file) return
      this.addWatchFile(file)
      const result = await prepareBuildSassSource(context, file, dependency => this.addWatchFile(dependency))
      for (const dependency of result.deps ?? []) this.addWatchFile(dependency)
      if (isSassModuleID(id)) {
        const modules = result.modules ?? {}
        const exports = Object.entries(modules).filter(([key]) => key !== 'default').map(([key, value], index) => `const value${index} = ${JSON.stringify(value)}; export { value${index} as ${JSON.stringify(key)} };`)
        return `import ${JSON.stringify(sassSourceID(file))};\n${exports.join('\n')}\nexport default ${JSON.stringify(modules)};`
      }
      return { code: result.code, map: result.map }
    }
  }
}
