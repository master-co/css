import { createRequire } from 'node:module'
import { stripResourceQuery, toConfigModuleResult, type ConfigModuleResult } from './module'
import type { LoadConfigOptions, LoadConfigResult } from './shared'

type CompileCSSFile = typeof import('@master/css-compiler')['compileCSSFile']

const require = createRequire(import.meta.url)

async function loadCompileCSS() {
    return (await import('@master/css-compiler')).compileCSSFile
}

function loadCompileCSSSync() {
    return require('@master/css-compiler').compileCSSFile as CompileCSSFile
}

function toCSSLoadConfigResult(result: ReturnType<CompileCSSFile>): LoadConfigResult {
    const nativeCSS = (result as typeof result & { nativeCSS?: string }).nativeCSS
    return {
        config: result.config,
        dependencies: result.dependencies,
        classNames: result.classNames,
        nativeClassNames: result.nativeClassNames,
        nativeCSS,
        css: result.css,
        generatedCSS: result.generatedCSS,
        warnings: result.warnings
    }
}

export async function loadCSSConfig(path: string, options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
    const compileCSSFile = await loadCompileCSS()
    return toCSSLoadConfigResult(compileCSSFile(stripResourceQuery(path), {
        classes: options.classes,
        preserveNativeCSS: false
    }))
}

export function loadCSSConfigSync(path: string, options: LoadConfigOptions = {}): LoadConfigResult {
    const compileCSSFile = loadCompileCSSSync()
    return toCSSLoadConfigResult(compileCSSFile(stripResourceQuery(path), {
        classes: options.classes,
        preserveNativeCSS: false
    }))
}

export async function loadCSSConfigModule(path: string, options: LoadConfigOptions = {}): Promise<ConfigModuleResult> {
    return toConfigModuleResult(await loadCSSConfig(path, options))
}

export function loadCSSConfigModuleSync(path: string, options: LoadConfigOptions = {}): ConfigModuleResult {
    return toConfigModuleResult(loadCSSConfigSync(path, options))
}
