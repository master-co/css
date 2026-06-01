import { dirname, extname, isAbsolute, resolve } from 'node:path'
import {
    DEFAULT_EXTENSIONS,
    DEFAULT_FOUND,
    DEFAULT_MISSING,
    formatMissingConfigWarning,
    resolveConfig,
    resolveConfigPath,
    warnMissingConfig,
    type ExploreConfigOptions,
    type ExploreConfigPath,
    type ExploreConfigResult,
    type LoadConfigOptions,
    type LoadConfigResult,
    type MissingConfigWarningOptions
} from './shared'
import { collectScriptDependencies, importConfigModule } from './script'
import { loadCSSConfig } from './css'
import {
    fromResolvedMasterCSSConfigId,
    isMasterCSSConfigRequest,
    stripMasterCSSConfigQuery,
    stripResourceQuery,
    toConfigModuleResult,
    toResolvedMasterCSSConfigId,
    type ConfigModuleResult
} from './module'

export {
    DEFAULT_EXTENSIONS,
    DEFAULT_MISSING,
    formatMissingConfigWarning,
    resolveConfigPath,
    warnMissingConfig,
    type ExploreConfigOptions,
    type ExploreConfigPath,
    type ExploreConfigResult,
    type LoadConfigOptions,
    type LoadConfigResult,
    type MissingConfigWarningOptions
}
export * from './module'
export { loadCSSConfig, loadCSSConfigModule } from './css'

export async function loadConfig(path: string, options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
    if (extname(path) === '.css') {
        return loadCSSConfig(path, options)
    }
    return {
        config: resolveConfig(await importConfigModule(path), options),
        dependencies: collectScriptDependencies(path)
    }
}

export async function loadConfigModule(path: string, options: LoadConfigOptions = {}): Promise<ConfigModuleResult> {
    return toConfigModuleResult(await loadConfig(stripResourceQuery(path), options))
}

export function createMasterCSSConfigLoaderPlugin(options: {
    cwd?: string
    loadConfigModule?: typeof loadConfigModule
} = {}) {
    return {
        name: 'master-css:config-loader',
        enforce: 'pre' as const,
        async resolveId(this: { resolve?: (id: string, importer?: string, options?: { skipSelf?: boolean }) => Promise<{ id: string } | null | undefined> }, id: string, importer?: string) {
            if (!isMasterCSSConfigRequest(id)) return
            const sourceId = stripMasterCSSConfigQuery(id)
            const resolved = await this.resolve?.(sourceId, importer, { skipSelf: true })
            if (resolved) return toResolvedMasterCSSConfigId(resolved.id)
            const baseDir = importer
                ? dirname(stripResourceQuery(importer))
                : options.cwd || process.cwd()
            const file = isAbsolute(sourceId) ? sourceId : resolve(baseDir, sourceId)
            return toResolvedMasterCSSConfigId(file)
        },
        async load(this: { addWatchFile?: (id: string) => void }, id: string) {
            const configPath = fromResolvedMasterCSSConfigId(id)
            if (!configPath) return
            const result = await (options.loadConfigModule || loadConfigModule)(configPath)
            for (const dependency of result.dependencies) {
                this.addWatchFile?.(dependency)
            }
            return result.code
        }
    }
}

export async function exploreConfig(options: ExploreConfigOptions & { name?: string } = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) {
        const missing = Object.hasOwn(options, 'missing') ? options.missing : DEFAULT_MISSING
        missing?.(options.name || 'master.css', options.cwd || '')
        return
    }
    const result = await loadConfig(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        ...result
    } satisfies ExploreConfigResult
}

export default exploreConfig
