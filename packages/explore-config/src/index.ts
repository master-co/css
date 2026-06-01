import { extname } from 'node:path'
import { createCSSConfigLoader, type CompileCSSFile, type CSSDirectiveConfigAdapter } from 'shared/css-config-loader'
import type { Config } from 'shared/css-config'
import {
    createMasterCSSConfigLoaderPlugin as createSharedMasterCSSConfigLoaderPlugin
} from 'shared/css-config-loader-plugin'
import {
    stripResourceQuery,
    toConfigModuleResult,
    type CSSConfigModuleResult
} from 'shared/css-config-module'
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
import './sync'

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
export * from 'shared/css-config-module'

export type ConfigModuleResult = CSSConfigModuleResult<Config>

async function loadCompileCSS() {
    return (await import('@master/css-compiler')).compileCSSFile as CompileCSSFile
}

async function loadCSSDirectiveConfigAdapter(options: LoadConfigOptions = {}) {
    if (options.createConfigFromCSSDirectives) {
        return {
            createConfigFromCSSDirectives: options.createConfigFromCSSDirectives,
            baseConfig: options.baseConfig
        }
    }
    const masterCSS = await import('@master/css')
    return {
        createConfigFromCSSDirectives: masterCSS.createConfigFromCSSDirectives as CSSDirectiveConfigAdapter<Config>,
        baseConfig: masterCSS.config as Config
    }
}

export async function loadCSSConfig(path: string, options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
    const { createConfigFromCSSDirectives, baseConfig } = await loadCSSDirectiveConfigAdapter(options)
    return createCSSConfigLoader({
        compileCSSFile: await loadCompileCSS(),
        createConfigFromCSSDirectives,
        baseConfig
    }).loadCSSConfig(path, options)
}

export async function loadCSSConfigModule(path: string, options: LoadConfigOptions = {}): Promise<ConfigModuleResult> {
    return createCSSConfigLoader({
        compileCSSFile: await loadCompileCSS(),
        ...await loadCSSDirectiveConfigAdapter(options)
    }).loadCSSConfigModule(path, options)
}

export async function loadConfig(path: string, options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
    if (extname(stripResourceQuery(path)) === '.css') {
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
    createConfigFromCSSDirectives?: LoadConfigOptions['createConfigFromCSSDirectives']
    baseConfig?: LoadConfigOptions['baseConfig']
} = {}) {
    return createSharedMasterCSSConfigLoaderPlugin({
        cwd: options.cwd,
        loadConfigModule: (path) => (options.loadConfigModule || loadConfigModule)(path, {
            createConfigFromCSSDirectives: options.createConfigFromCSSDirectives,
            baseConfig: options.baseConfig
        })
    })
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
