import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import type { PluginContext } from '../core'
import {
  fromResolvedMasterCSSManifestId,
  toResolvedMasterCSSManifestId
} from '@master/css-internal-integration/node'
import { loadManifestJSON } from '@master/css-compiler/project'
import { isCSSManifestRequest } from '@master/css-compiler/project/entries'
import {
  isMasterCSSManifestRequest,
  stripMasterCSSManifestQuery
} from '@master/css-internal-integration/manifest-module'
import {
  MANIFEST_ASSET_FILE,
  toBrowserManifestFacadeModule,
  toInlineManifestModule,
  toUniversalManifestFacadeModule
} from '@master/css-internal-integration/manifest-facade'
import { collectStyleCSSDependencies } from '@master/css-compiler/stylesheet'
import { includesFile } from '../utils/path'

function invalidateManifestModule(module: ModuleNode | undefined, server: ViteDevServer): ModuleNode[] {
  if (!module) return []
  server.moduleGraph.invalidateModule(module)
  return [module]
}

function isProductionBuild(context: PluginContext) {
  return context.config?.command === 'build'
}

function isServerBuild(context: PluginContext) {
  return Boolean(context.config?.build.ssr)
}

function createManifestModule(
  context: PluginContext,
  pluginContext: { emitFile?: (asset: { type: 'asset', name: string, source: string }) => string },
  json: string
) {
  if (!isProductionBuild(context) || !pluginContext.emitFile) return toInlineManifestModule(json)
  const referenceId = pluginContext.emitFile({
    type: 'asset',
    name: MANIFEST_ASSET_FILE,
    source: json
  })
  const urlExpression = `import.meta.ROLLUP_FILE_URL_${referenceId}`
  return isServerBuild(context)
    ? toUniversalManifestFacadeModule(urlExpression)
    : toBrowserManifestFacadeModule(urlExpression)
}

export default function ManifestLoaderPlugin(context: PluginContext): Plugin {
  const cssManifestDependencies = new Map<string, string[]>()
  const addServerAllow = (paths: string[]) => {
    const allow = context.config?.server.fs.allow
    if (!allow) return
    for (const path of paths) {
      if (!allow.includes(path)) allow.push(path)
    }
  }
  const watchManifestDependencies = (manifestPath: string, dependencies: string[] = []) => {
    cssManifestDependencies.set(manifestPath, dependencies)
    addServerAllow(dependencies)
  }
  return {
    name: 'master-css:manifest-loader',
    enforce: 'pre',
    async resolveId(id, importer) {
      if (!isMasterCSSManifestRequest(id)) return
      const sourceId = stripMasterCSSManifestQuery(id)
      const resolved = await this.resolve(sourceId, importer, { skipSelf: true })
      if (resolved) return toResolvedMasterCSSManifestId(resolved.id)
    },
    async load(id) {
      const manifestPath = fromResolvedMasterCSSManifestId(id)
      if (!manifestPath) return
      if (!isCSSManifestRequest(manifestPath)) {
        throw new TypeError('Master CSS manifest queries only support CSS entry files.')
      }
      const dependencies = new Set(collectStyleCSSDependencies(manifestPath, undefined, context.config?.root))
      for (const dependency of dependencies) {
        this.addWatchFile(dependency)
      }
      watchManifestDependencies(manifestPath, [...dependencies])
      const result = await loadManifestJSON(manifestPath)
      for (const dependency of result.dependencies) {
        if (dependencies.has(dependency)) continue
        dependencies.add(dependency)
        this.addWatchFile(dependency)
      }
      watchManifestDependencies(manifestPath, [...dependencies])
      return createManifestModule(context, this, result.json)
    },
    async handleHotUpdate({ file, server }) {
      let handled = false
      const modules: ModuleNode[] = []
      const queryManifestPaths = new Set([file])
      for (const [manifestPath, dependencies] of cssManifestDependencies) {
        if (includesFile(dependencies, file)) queryManifestPaths.add(manifestPath)
      }
      for (const manifestPath of queryManifestPaths) {
        const queryModule = server.moduleGraph.getModuleById(toResolvedMasterCSSManifestId(manifestPath))
        if (!queryModule) continue
        handled = true
        modules.push(...invalidateManifestModule(queryModule, server))
      }
      if (handled) return modules
    }
  }
}
