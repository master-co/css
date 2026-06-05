import { extname } from 'node:path'
import {
    compileCSSConfigFile,
    compileCSSConfigModule,
    compileProjectConfig,
    compileProjectConfigModule
} from '@master/css-compiler'
import type { Config } from 'shared/css-config'
import {
    type CSSConfigModuleResult,
    stripResourceQuery
} from '@master/css-integration/config-module'
import {
    type LoadConfigOptions,
    type LoadConfigResult,
    type LoadProjectConfigOptions,
    type LoadProjectConfigResult
} from './options'
import { findCSSConfigEntryFilesSync } from './css'

export type {
    LoadConfigOptions,
    LoadConfigResult,
    LoadProjectConfigOptions,
    LoadProjectConfigResult
} from './options'

export type ConfigModuleResult = CSSConfigModuleResult<Config>

export function loadConfigSync(path: string, options: LoadConfigOptions = {}): LoadConfigResult {
    if (extname(stripResourceQuery(path)) === '.css') {
        return compileCSSConfigFile(stripResourceQuery(path), options)
    }
    throw new TypeError('Master CSS config modules can only be loaded from CSS files.')
}

export function loadConfigModuleSync(path: string, options: LoadConfigOptions = {}): ConfigModuleResult {
    if (extname(stripResourceQuery(path)) === '.css') {
        return compileCSSConfigModule(stripResourceQuery(path), options)
    }
    throw new TypeError('Master CSS config modules can only be loaded from CSS files.')
}

export function loadProjectConfigSync(projectDir = process.cwd(), options: LoadProjectConfigOptions = {}): LoadProjectConfigResult {
    const entries = options.entries ?? findCSSConfigEntryFilesSync(projectDir)
    return compileProjectConfig(entries, {
        ...options,
        root: projectDir
    })
}

export function loadProjectConfigModuleSync(projectDir = process.cwd(), options: LoadProjectConfigOptions = {}) {
    const entries = options.entries ?? findCSSConfigEntryFilesSync(projectDir)
    return compileProjectConfigModule(entries, {
        ...options,
        root: projectDir
    })
}
