import { createRequire } from 'node:module'
import { extname } from 'node:path'
import { createCSSConfigLoader, type CompileCSSFile, type CSSDirectiveConfigAdapter } from 'shared/css-config-loader'
import type { Config } from 'shared/css-config'
import {
    stripResourceQuery,
    toConfigModuleResult,
    type CSSConfigModuleResult
} from 'shared/css-config-module'
import {
    resolveConfig,
    type LoadConfigOptions,
    type LoadConfigResult
} from './options'
import { collectScriptDependencies, configureCSSConfigModuleSourceLoader, requireConfigModule } from './script'

export type {
    LoadConfigOptions,
    LoadConfigResult
} from './options'

export type ConfigModuleResult = CSSConfigModuleResult<Config>

const require = createRequire(import.meta.url)

function loadCompileCSSSync() {
    return require('@master/css-compiler').compileCSSFile as CompileCSSFile
}

function loadCSSDirectiveConfigAdapterSync(options: LoadConfigOptions = {}) {
    if (options.createConfigFromCSSDirectives) return options.createConfigFromCSSDirectives
    const module = require('@master/css/create-config-from-css-directives') as {
        default: CSSDirectiveConfigAdapter<Config>
    }
    return module.default
}

function loadCSSConfigSync(path: string, options: LoadConfigOptions = {}): LoadConfigResult {
    const createConfigFromCSSDirectives = loadCSSDirectiveConfigAdapterSync(options)
    return createCSSConfigLoader({
        compileCSSFile: loadCompileCSSSync(),
        createConfigFromCSSDirectives
    }).loadCSSConfig(path, options)
}

function loadCSSConfigModuleSync(path: string, options: LoadConfigOptions = {}): ConfigModuleResult {
    return createCSSConfigLoader({
        compileCSSFile: loadCompileCSSSync(),
        createConfigFromCSSDirectives: loadCSSDirectiveConfigAdapterSync(options)
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
