import { extname } from 'node:path'
import {
    createCSSConfigLoader,
    type CompileCSSFile,
    type CSSDirectiveConfigAdapter
} from 'shared/css-config-loader'
import type { Config } from 'shared/css-config'
import {
    stripResourceQuery,
    toConfigModuleResult,
    type CSSConfigModuleResult
} from 'shared/css-config-module'
import {
    type LoadConfigOptions,
    type LoadConfigResult,
    type LoadProjectConfigOptions,
    type LoadProjectConfigResult
} from './options'
import { compileCSSConfigFile, findCSSConfigEntryFiles } from './css'
import { compileProjectConfigEntries } from './project'

export type {
    LoadConfigOptions,
    LoadConfigResult,
    LoadProjectConfigOptions,
    LoadProjectConfigResult
} from './options'

export type ConfigModuleResult = CSSConfigModuleResult<Config>

async function loadCompileCSS() {
    const { compileCSS } = await import('@master/css-compiler')
    return ((path, options) => compileCSSConfigFile(compileCSS, path, options)) as CompileCSSFile
}

async function loadCSSDirectiveConfigAdapter(options: LoadConfigOptions = {}) {
    if (options.createConfigFromCSSDirectives) return options.createConfigFromCSSDirectives
    const module = await import('@master/css/create-config-from-css-directives')
    return module.default as CSSDirectiveConfigAdapter<Config>
}

async function loadCSSConfig(path: string, options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
    const createConfigFromCSSDirectives = await loadCSSDirectiveConfigAdapter(options)
    return createCSSConfigLoader({
        compileCSSFile: await loadCompileCSS(),
        createConfigFromCSSDirectives
    }).loadCSSConfig(path, options)
}

export async function loadConfig(path: string, options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
    if (extname(stripResourceQuery(path)) === '.css') {
        return loadCSSConfig(path, options)
    }
    throw new TypeError('Master CSS config modules can only be loaded from CSS files.')
}

export async function loadConfigModule(path: string, options: LoadConfigOptions = {}): Promise<ConfigModuleResult> {
    return toConfigModuleResult(await loadConfig(stripResourceQuery(path), options))
}

export async function loadProjectConfig(projectDir = process.cwd(), options: LoadProjectConfigOptions = {}): Promise<LoadProjectConfigResult> {
    const entries = options.entries ?? await findCSSConfigEntryFiles(projectDir)
    return compileProjectConfigEntries(
        entries,
        await loadCompileCSS(),
        await loadCSSDirectiveConfigAdapter(options),
        options
    )
}

export async function loadProjectConfigModule(projectDir = process.cwd(), options: LoadProjectConfigOptions = {}) {
    return toConfigModuleResult(await loadProjectConfig(projectDir, options))
}
