import { createRequire } from 'node:module'
import { extname } from 'node:path'
import { createCSSConfigLoader, type CompileCSSFile } from 'shared/css-config-loader'
import type { Config } from 'shared/css-config'
import {
    stripResourceQuery,
    toConfigModuleResult,
    type CSSConfigModuleResult
} from 'shared/css-config-module'
import {
    DEFAULT_MISSING,
    DEFAULT_FOUND,
    resolveConfig,
    resolveConfigPath,
    type ExploreConfigOptions,
    type ExploreConfigResult,
    type LoadConfigOptions,
    type LoadConfigResult
} from './shared'
import { collectScriptDependencies, configureCSSConfigModuleSourceLoader, requireConfigModule } from './script'
import type { CSSDirectiveConfigAdapter } from 'shared/css-config-loader'

export * from 'shared/css-config-module'

export type ConfigModuleResult = CSSConfigModuleResult<Config>

const require = createRequire(import.meta.url)

function loadCompileCSSSync() {
    return require('@master/css-compiler').compileCSSFile as CompileCSSFile
}

function loadCSSDirectiveConfigAdapterSync(options: LoadConfigOptions = {}) {
    if (options.createConfigFromCSSDirectives) {
        return {
            createConfigFromCSSDirectives: options.createConfigFromCSSDirectives,
            baseConfig: options.baseConfig
        }
    }
    const masterCSS = require('@master/css') as { createConfigFromCSSDirectives?: CSSDirectiveConfigAdapter<Config> }
    if (masterCSS.createConfigFromCSSDirectives) {
        return {
            createConfigFromCSSDirectives: masterCSS.createConfigFromCSSDirectives,
            baseConfig: (masterCSS as { config?: Config }).config
        }
    }
    return {
        createConfigFromCSSDirectives: require('../../core/src/utils/create-config-from-css-directives').default as CSSDirectiveConfigAdapter<Config>,
        baseConfig: (masterCSS as { config?: Config }).config
    }
}

export function loadCSSConfigSync(path: string, options: LoadConfigOptions = {}): LoadConfigResult {
    const { createConfigFromCSSDirectives, baseConfig } = loadCSSDirectiveConfigAdapterSync(options)
    return createCSSConfigLoader({
        compileCSSFile: loadCompileCSSSync(),
        createConfigFromCSSDirectives,
        baseConfig
    }).loadCSSConfig(path, options)
}

export function loadCSSConfigModuleSync(path: string, options: LoadConfigOptions = {}): ConfigModuleResult {
    return createCSSConfigLoader({
        compileCSSFile: loadCompileCSSSync(),
        ...loadCSSDirectiveConfigAdapterSync(options)
    }).loadCSSConfigModule(path, options)
}

configureCSSConfigModuleSourceLoader((path) => loadCSSConfigModuleSync(path).code)

export function loadConfigSync(path: string, options: LoadConfigOptions = {}): LoadConfigResult {
    if (extname(stripResourceQuery(path)) === '.css') {
        return loadCSSConfigSync(path, options)
    }
    return {
        config: resolveConfig(requireConfigModule(path), options),
        dependencies: collectScriptDependencies(path)
    }
}

export function loadConfigModuleSync(path: string, options: LoadConfigOptions = {}): ConfigModuleResult {
    return toConfigModuleResult(loadConfigSync(stripResourceQuery(path), options))
}

export function exploreConfigSync(options: ExploreConfigOptions & { name?: string } = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) {
        const missing = Object.hasOwn(options, 'missing') ? options.missing : DEFAULT_MISSING
        missing?.(options.name || 'master.css', options.cwd || '')
        return
    }
    const result = loadConfigSync(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        ...result
    } satisfies ExploreConfigResult
}

export default exploreConfigSync
