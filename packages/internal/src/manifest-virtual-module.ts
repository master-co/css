import {
  RESOLVED_VIRTUAL_MANIFEST_ID,
  VIRTUAL_MANIFEST_ID,
  toManifestJSON
} from './manifest-module'
import {
  MANIFEST_ASSET_FILE,
  toBrowserManifestFacadeModule,
  toInlineManifestModule,
  toUniversalManifestFacadeModule
} from './manifest-facade'
import type { MasterCSSVirtualManifestLoadResult } from './manifest-loader'

interface MasterCSSManifestVirtualModuleConfig {
  readonly root?: string
  readonly command?: string
  readonly build?: {
    readonly ssr?: unknown
  }
  readonly server?: {
    readonly fs?: {
      readonly allow?: string[]
    }
  }
}

export interface MasterCSSManifestVirtualModuleContext {
  config?: MasterCSSManifestVirtualModuleConfig
  defaultManifestAssetReferenceId?: string
  defaultManifestAssetSource?: string
}

export type MasterCSSManifestVirtualModuleLoader = (
  options: {
    readonly root?: string
    readonly onDependency: (dependency: string) => void
  }
) => Promise<MasterCSSVirtualManifestLoadResult>

interface MasterCSSVirtualModuleNode {
  readonly id?: string | null
}

interface MasterCSSVirtualModulePluginContext {
  readonly addWatchFile?: (id: string) => void
  readonly emitFile?: (asset: {
    readonly type: 'asset'
    readonly name: string
    readonly source: string
  }) => string
}

interface MasterCSSVirtualModuleServer {
  readonly moduleGraph: {
    getModuleById(id: string): MasterCSSVirtualModuleNode | undefined
    invalidateModule(module: MasterCSSVirtualModuleNode): void
  }
}

function invalidateManifestModule(
  module: MasterCSSVirtualModuleNode | undefined,
  server: MasterCSSVirtualModuleServer
) {
  if (!module) return []
  server.moduleGraph.invalidateModule(module)
  return [module]
}

function isProductionBuild(context: MasterCSSManifestVirtualModuleContext) {
  return context.config?.command === 'build'
}

function isServerBuild(context: MasterCSSManifestVirtualModuleContext) {
  return Boolean(context.config?.build?.ssr)
}

function createManifestModule(
  context: MasterCSSManifestVirtualModuleContext,
  pluginContext: MasterCSSVirtualModulePluginContext,
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

export function createMasterCSSManifestVirtualModulePlugin(
  loadManifest: MasterCSSManifestVirtualModuleLoader,
  context: MasterCSSManifestVirtualModuleContext = {}
) {
  let cssManifestDependencies: readonly string[] = []
  const addServerAllow = (dependency: string) => {
    const allow = context.config?.server?.fs?.allow
    if (allow && !allow.includes(dependency)) allow.push(dependency)
  }
  const loadDefaultManifest = async (pluginContext: MasterCSSVirtualModulePluginContext) => {
    const dependencies = new Set<string>()
    const result = await loadManifest({
      root: context.config?.root,
      onDependency(dependency) {
        dependencies.add(dependency)
        cssManifestDependencies = Object.freeze([...dependencies])
        addServerAllow(dependency)
        pluginContext.addWatchFile?.(dependency)
      }
    })
    cssManifestDependencies = result.dependencies
    return result
  }
  return {
    name: 'master-css:virtual-module:manifest',
    enforce: 'pre' as const,
    configResolved(config: MasterCSSManifestVirtualModuleConfig) {
      context.config = config
    },
    async buildStart(this: MasterCSSVirtualModulePluginContext) {
      if (isProductionBuild(context)) return
      await loadDefaultManifest(this)
    },
    resolveId(id: string) {
      if (id === VIRTUAL_MANIFEST_ID) return RESOLVED_VIRTUAL_MANIFEST_ID
    },
    async load(this: MasterCSSVirtualModulePluginContext, id: string) {
      if (id === RESOLVED_VIRTUAL_MANIFEST_ID) {
        const result = await loadDefaultManifest(this)
        return createManifestModule(context, this, toManifestJSON(result.manifest))
      }
    },
    handleHotUpdate({
      file,
      server
    }: {
      file: string
      server: MasterCSSVirtualModuleServer
    }) {
      if (!cssManifestDependencies.includes(file)) return
      return invalidateManifestModule(
        server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MANIFEST_ID),
        server
      )
    }
  }
}
