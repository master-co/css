import {
  RESOLVED_VIRTUAL_MANIFEST_ID,
  VIRTUAL_MANIFEST_ID,
  toManifestJSON,
  toProductionManifestJSON,
  type MasterCSSManifest
} from './manifest-module'
import {
  MANIFEST_ASSET_FILE,
  toBrowserManifestFacadeModule,
  toInlineManifestModule,
  toServerManifestFileURL,
  toUniversalManifestFacadeModule
} from './manifest-facade'
import type { MasterCSSVirtualManifestLoadResult } from './manifest-loader'
import {
  PROGRAM_ASSET_FILE,
  RESOLVED_VIRTUAL_PROGRAM_ID,
  VIRTUAL_PROGRAM_ID,
  toBrowserProgramFacadeModule,
  toInlineProgramModule
} from './program-module'

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
  defaultProgramAssetReferenceId?: string
  defaultProgramAssetSource?: Uint8Array
}

/** Compiles a manifest into the runtime program browsers execute, with `@master/css/node`. */
export type MasterCSSRuntimeProgramCompiler = (manifest: MasterCSSManifest) => Promise<Uint8Array>

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
  readonly environment?: {
    readonly config: {
      readonly consumer?: string
    }
  }
  readonly addWatchFile?: (id: string) => void
  readonly emitFile?: (asset: {
    readonly type: 'asset'
    readonly name: string
    readonly source: string | Uint8Array
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

function isProductionBuild(context: Pick<MasterCSSManifestVirtualModuleContext, 'config'>) {
  return context.config?.command === 'build'
}

function isServerBuild(
  context: Pick<MasterCSSManifestVirtualModuleContext, 'config'>,
  pluginContext: MasterCSSVirtualModulePluginContext
) {
  // An environment build shares one config across client and server output.
  if (pluginContext.environment) return pluginContext.environment.config.consumer === 'server'
  return Boolean(context.config?.build?.ssr)
}

function createManifestModule(
  context: MasterCSSManifestVirtualModuleContext,
  pluginContext: MasterCSSVirtualModulePluginContext,
  manifest: MasterCSSManifest,
  serverReferences: Set<string>
) {
  context.defaultManifestAssetReferenceId = undefined
  context.defaultManifestAssetSource = undefined
  if (!isProductionBuild(context)) return toInlineManifestModule(toManifestJSON(manifest))
  const json = toProductionManifestJSON(manifest)
  if (!pluginContext.emitFile) return toInlineManifestModule(json)
  const referenceId = pluginContext.emitFile({
    type: 'asset',
    name: MANIFEST_ASSET_FILE,
    source: json
  })
  const urlExpression = `import.meta.ROLLUP_FILE_URL_${referenceId}`
  const server = isServerBuild(context, pluginContext)
  if (server) serverReferences.add(referenceId)
  else {
    context.defaultManifestAssetReferenceId = referenceId
    context.defaultManifestAssetSource = json
  }
  return server
    ? toUniversalManifestFacadeModule(urlExpression)
    : toBrowserManifestFacadeModule(urlExpression)
}

export interface MasterCSSProgramModule {
  readonly code: string
  /** The emitted program of a browser build, which pages can preload. */
  readonly asset?: {
    readonly referenceId: string
    readonly source: Uint8Array
  }
}

/**
 * Development and server builds inline the program; browser builds emit it with
 * production manifest provenance removed and fetch it.
 */
export async function createMasterCSSProgramModule(
  context: Pick<MasterCSSManifestVirtualModuleContext, 'config'>,
  pluginContext: MasterCSSVirtualModulePluginContext,
  manifest: MasterCSSManifest,
  compileProgram: MasterCSSRuntimeProgramCompiler
): Promise<MasterCSSProgramModule> {
  if (!isProductionBuild(context)) return { code: toInlineProgramModule(await compileProgram(manifest)) }
  const program = await compileProgram(JSON.parse(toProductionManifestJSON(manifest)) as MasterCSSManifest)
  if (!pluginContext.emitFile || isServerBuild(context, pluginContext)) return { code: toInlineProgramModule(program) }
  const referenceId = pluginContext.emitFile({
    type: 'asset',
    name: PROGRAM_ASSET_FILE,
    source: program
  })
  return {
    code: toBrowserProgramFacadeModule(`import.meta.ROLLUP_FILE_URL_${referenceId}`),
    asset: { referenceId, source: program }
  }
}

/**
 * Serves `virtual:master-css-manifest` and, given a compiler, the
 * `virtual:master-css-program` that browsers execute.
 */
export function createMasterCSSManifestVirtualModulePlugin(
  loadManifest: MasterCSSManifestVirtualModuleLoader,
  context: MasterCSSManifestVirtualModuleContext = {},
  compileProgram?: MasterCSSRuntimeProgramCompiler
) {
  let cssManifestDependencies: readonly string[] = []
  const serverManifestReferences = new Set<string>()
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
      if (id === VIRTUAL_PROGRAM_ID && compileProgram) return RESOLVED_VIRTUAL_PROGRAM_ID
    },
    async load(this: MasterCSSVirtualModulePluginContext, id: string) {
      if (id === RESOLVED_VIRTUAL_MANIFEST_ID) {
        const result = await loadDefaultManifest(this)
        return createManifestModule(context, this, result.manifest, serverManifestReferences)
      }
      if (id === RESOLVED_VIRTUAL_PROGRAM_ID && compileProgram) {
        const result = await loadDefaultManifest(this)
        const module = await createMasterCSSProgramModule(context, this, result.manifest, compileProgram)
        context.defaultProgramAssetReferenceId = module.asset?.referenceId
        context.defaultProgramAssetSource = module.asset?.source
        return module.code
      }
    },
    resolveFileUrl({ referenceId, relativePath, format }: { referenceId: string, relativePath: string, format: string }) {
      if (serverManifestReferences.has(referenceId)) return toServerManifestFileURL(relativePath, format)
    },
    handleHotUpdate({
      file,
      modules = [],
      server
    }: {
      file: string
      modules?: readonly MasterCSSVirtualModuleNode[]
      server: MasterCSSVirtualModuleServer
    }) {
      if (!cssManifestDependencies.includes(file)) return
      // A manifest dependency may also be an ordinary stylesheet or a queried
      // source module. Adding the virtual manifest must not consume their HMR.
      return [...new Set([
        ...modules,
        ...invalidateManifestModule(server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MANIFEST_ID), server),
        ...invalidateManifestModule(server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_PROGRAM_ID), server)
      ])]
    }
  }
}
