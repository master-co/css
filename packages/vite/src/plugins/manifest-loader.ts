import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import {
  fromResolvedMasterCSSManifestId,
  toResolvedMasterCSSManifestId
} from '@master/css-internal/node'
import { compileProjectManifest } from '@master/css-compiler/project'
import {
  isMasterCSSManifestRequest,
  stripMasterCSSManifestQuery
} from '@master/css-internal/manifest-module'
import {
  defaultBuildManifest,
  isManifestStylesheetRequest
} from '@master/css-internal/project'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import {
  MANIFEST_ASSET_FILE,
  toBrowserManifestFacadeModule,
  toInlineManifestModule,
  toUniversalManifestFacadeModule
} from '@master/css-internal/manifest-facade'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'
import { includesFile } from '../utils/path'

function invalidateManifestModule(module: ModuleNode | undefined, server: ViteDevServer): ModuleNode[] {
  if (!module) return []
  server.moduleGraph.invalidateModule(module)
  return [module]
}

function isProductionBuild(context: MasterCSSVitePluginContext) {
  return context.config?.command === 'build'
}

function isServerBuild(context: MasterCSSVitePluginContext) {
  return Boolean(context.config?.build.ssr)
}

function createManifestModule(
  context: MasterCSSVitePluginContext,
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

export default function ManifestLoaderPlugin(context: MasterCSSVitePluginContext): Plugin {
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
      if (!isManifestStylesheetRequest(manifestPath)) {
        throw new TypeError('Master CSS manifest queries only support CSS entry files.')
      }
      const dependencies = new Set(collectStylesheetDependenciesSync(manifestPath, undefined, {
        projectDir: context.config?.root
      }))
      for (const dependency of dependencies) {
        this.addWatchFile(dependency)
      }
      watchManifestDependencies(manifestPath, [...dependencies])
      const result = await compileProjectManifest({
        root: context.config?.root,
        entries: [manifestPath],
        baseManifest: defaultBuildManifest
      })
      for (const dependency of result.dependencies) {
        if (dependencies.has(dependency)) continue
        dependencies.add(dependency)
        this.addWatchFile(dependency)
      }
      watchManifestDependencies(manifestPath, [...dependencies])
      return createManifestModule(context, this, serializeMasterCSSManifest(result.manifest))
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
