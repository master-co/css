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
import { collectScriptDependencies, importConfigModule } from './script'
import './load-sync'

export type {
    LoadConfigOptions,
    LoadConfigResult
} from './options'

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

async function loadCSSConfig(path: string, options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
    const { createConfigFromCSSDirectives, baseConfig } = await loadCSSDirectiveConfigAdapter(options)
    return createCSSConfigLoader({
        compileCSSFile: await loadCompileCSS(),
        createConfigFromCSSDirectives,
        baseConfig
    }).loadCSSConfig(path, options)
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
