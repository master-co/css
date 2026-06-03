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
} from 'shared/css-config-module'
import {
    type LoadConfigOptions,
    type LoadConfigResult,
    type LoadProjectConfigOptions,
    type LoadProjectConfigResult
} from './options'
import { findCSSConfigEntryFiles } from './css'

export type {
    LoadConfigOptions,
    LoadConfigResult,
    LoadProjectConfigOptions,
    LoadProjectConfigResult
} from './options'

export type ConfigModuleResult = CSSConfigModuleResult<Config>

export async function loadConfig(path: string, options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
    if (extname(stripResourceQuery(path)) === '.css') {
        return compileCSSConfigFile(stripResourceQuery(path), options)
    }
    throw new TypeError('Master CSS config modules can only be loaded from CSS files.')
}

export async function loadConfigModule(path: string, options: LoadConfigOptions = {}): Promise<ConfigModuleResult> {
    if (extname(stripResourceQuery(path)) === '.css') {
        return compileCSSConfigModule(stripResourceQuery(path), options)
    }
    throw new TypeError('Master CSS config modules can only be loaded from CSS files.')
}

export async function loadProjectConfig(projectDir = process.cwd(), options: LoadProjectConfigOptions = {}): Promise<LoadProjectConfigResult> {
    const entries = options.entries ?? await findCSSConfigEntryFiles(projectDir)
    return compileProjectConfig(entries, {
        ...options,
        root: projectDir
    })
}

export async function loadProjectConfigModule(projectDir = process.cwd(), options: LoadProjectConfigOptions = {}) {
    const entries = options.entries ?? await findCSSConfigEntryFiles(projectDir)
    return compileProjectConfigModule(entries, {
        ...options,
        root: projectDir
    })
}
