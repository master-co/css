import { createRequire } from 'node:module'
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
import { compileCSSConfigFile, findCSSConfigEntryFilesSync } from './css'
import { compileProjectConfigEntries } from './project'

export type {
    LoadConfigOptions,
    LoadConfigResult,
    LoadProjectConfigOptions,
    LoadProjectConfigResult
} from './options'

export type ConfigModuleResult = CSSConfigModuleResult<Config>

const require = createRequire(import.meta.url)

function loadCompileCSSSync() {
    const { compileCSS } = require('@master/css-compiler') as typeof import('@master/css-compiler')
    return ((path, options) => compileCSSConfigFile(compileCSS, path, options)) as CompileCSSFile
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

export function loadConfigSync(path: string, options: LoadConfigOptions = {}): LoadConfigResult {
    if (extname(stripResourceQuery(path)) === '.css') {
        return loadCSSConfigSync(path, options)
    }
    throw new TypeError('Master CSS config modules can only be loaded from CSS files.')
}

export function loadConfigModuleSync(path: string, options: LoadConfigOptions = {}): ConfigModuleResult {
    return toConfigModuleResult(loadConfigSync(stripResourceQuery(path), options))
}

export function loadProjectConfigSync(projectDir = process.cwd(), options: LoadProjectConfigOptions = {}): LoadProjectConfigResult {
    const entries = options.entries ?? findCSSConfigEntryFilesSync(projectDir)
    return compileProjectConfigEntries(
        entries,
        loadCompileCSSSync(),
        loadCSSDirectiveConfigAdapterSync(options),
        options
    )
}

export function loadProjectConfigModuleSync(projectDir = process.cwd(), options: LoadProjectConfigOptions = {}) {
    return toConfigModuleResult(loadProjectConfigSync(projectDir, options))
}
