import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import { PluginContext } from '../core'
import { loadProjectManifest } from '@master/css-project/manifest'
import { findCSSManifestEntryFiles } from '@master/css-project/entries'
import { toManifestJSON } from '@master/css-integration/manifest-module'
import {
  MANIFEST_ASSET_FILE,
  toBrowserManifestFacadeModule,
  toInlineManifestModule,
  toUniversalManifestFacadeModule
} from '@master/css-integration/manifest-facade'
import { RESOLVED_VIRTUAL_MANIFEST_ID, VIRTUAL_MANIFEST_ID } from '../common'
import { PluginOptions } from '../options'
import { collectStyleCSSDependencies } from '@master/css-stylesheet'
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
  context.defaultManifestAssetReferenceId = undefined
  context.defaultManifestAssetSource = undefined
  if (!isProductionBuild(context) || !pluginContext.emitFile) return toInlineManifestModule(json)
  const referenceId = pluginContext.emitFile({
    type: 'asset',
    name: MANIFEST_ASSET_FILE,
    source: json
  })
  const urlExpression = `import.meta.ROLLUP_FILE_URL_${referenceId}`
  if (!isServerBuild(context)) {
    context.defaultManifestAssetReferenceId = referenceId
    context.defaultManifestAssetSource = json
  }
  return isServerBuild(context)
    ? toUniversalManifestFacadeModule(urlExpression)
    : toBrowserManifestFacadeModule(urlExpression)
}

export default function ManifestVirtualModulePlugin(
  options: PluginOptions,
  context: PluginContext
): Plugin {
  let cssManifestDependencies: string[] = []
  const addServerAllow = (paths: string[]) => {
    const allow = context.config?.server.fs.allow
    if (!allow) return
    for (const path of paths) {
      if (!allow.includes(path)) allow.push(path)
    }
  }
  const loadDefaultManifest = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
    const root = context.config?.root
    const entries = await findCSSManifestEntryFiles(root)
    const dependencies = new Set<string>()
    for (const entry of entries) {
      for (const dependency of collectStyleCSSDependencies(entry, undefined, root)) {
        dependencies.add(dependency)
      }
    }
    cssManifestDependencies = [...dependencies]
    addServerAllow(cssManifestDependencies)
    for (const dependency of cssManifestDependencies) {
      pluginContext.addWatchFile?.(dependency)
    }
    const result = await loadProjectManifest(root, { entries })
    for (const dependency of result.dependencies) {
      dependencies.add(dependency)
      pluginContext.addWatchFile?.(dependency)
    }
    cssManifestDependencies = [...dependencies]
    addServerAllow(cssManifestDependencies)
    return result
  }
  return {
    name: 'master-css:virtual-module:manifest',
    enforce: 'pre',
    async buildStart() {
      if (isProductionBuild(context)) return
      await loadDefaultManifest(this)
    },
    async resolveId(id) {
      if (id === VIRTUAL_MANIFEST_ID) return RESOLVED_VIRTUAL_MANIFEST_ID
    },
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MANIFEST_ID) {
        return createManifestModule(context, this, toManifestJSON((await loadDefaultManifest(this)).manifest))
      }
    },
    async handleHotUpdate({ file, server }) {
      let handled = false
      const modules: ModuleNode[] = []
      if (includesFile(cssManifestDependencies, file)) {
        handled = true
        modules.push(...invalidateManifestModule(
          server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MANIFEST_ID),
          server
        ))
      }
      if (handled) return modules
    }
  }
}
