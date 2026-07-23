import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import { MasterCSSVitePluginContext } from '../core'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { toManifestJSON } from '@master/css-build-internal/manifest-module'
import { defaultBuildManifest } from '@master/css-build-internal/project'
import {
  MANIFEST_ASSET_FILE,
  toBrowserManifestFacadeModule,
  toInlineManifestModule,
  toUniversalManifestFacadeModule
} from '@master/css-build-internal/manifest-facade'
import { RESOLVED_VIRTUAL_MANIFEST_ID, VIRTUAL_MANIFEST_ID } from '../common'
import { ResolvedMasterCSSVitePluginOptions } from '../options'
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
  options: ResolvedMasterCSSVitePluginOptions,
  context: MasterCSSVitePluginContext
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
    const entries = await discoverManifestEntries({ root })
    const dependencies = new Set<string>()
    for (const entry of entries) {
      for (const dependency of collectStylesheetDependenciesSync(entry, undefined, { projectDir: root })) {
        dependencies.add(dependency)
      }
    }
    cssManifestDependencies = [...dependencies]
    addServerAllow(cssManifestDependencies)
    for (const dependency of cssManifestDependencies) {
      pluginContext.addWatchFile?.(dependency)
    }
    const result = await loadProjectManifest({
      root,
      entries,
      baseManifest: defaultBuildManifest
    })
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
