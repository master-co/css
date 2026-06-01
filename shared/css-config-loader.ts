import type { Config } from './css-config.js'
import type { CSSDirectiveResult } from './css-directives.js'
import {
    stripResourceQuery,
    toConfigModuleResult,
    type CSSConfigLoadResult
} from './css-config-module.js'

export type CSSDirectiveConfigAdapterResult<TConfig extends object = Config> =
    | TConfig
    | { config: TConfig, warnings?: string[] }

export type CSSDirectiveConfigAdapter<TConfig extends object = Config> = (
    result: CSSDirectiveResult,
    options?: {
        config?: TConfig
        baseConfig?: TConfig
        onWarning?: (warning: string) => void
    }
) => CSSDirectiveConfigAdapterResult<TConfig>

export type CompileCSSFile = (
    file: string,
    options?: {
        classes?: string[]
        preserveNativeCSS?: boolean
    }
) => CSSDirectiveResult

export interface LoadCSSConfigOptions<TConfig extends object = Config> {
    classes?: string[]
    config?: TConfig
    baseConfig?: TConfig
    onWarning?: (warning: string) => void
}

export interface CSSConfigLoaderOptions<TConfig extends object = Config> {
    compileCSSFile: CompileCSSFile
    createConfigFromCSSDirectives: CSSDirectiveConfigAdapter<TConfig>
    baseConfig?: TConfig
}

function normalizeAdapterResult<TConfig extends object>(result: CSSDirectiveConfigAdapterResult<TConfig>): { config: TConfig, warnings?: string[] } {
    return 'config' in result ? result : { config: result }
}

function toCSSConfigLoadResult<TConfig extends object>(
    result: CSSDirectiveResult,
    adapterResult: CSSDirectiveConfigAdapterResult<TConfig>
): CSSConfigLoadResult<TConfig> {
    const normalizedAdapterResult = normalizeAdapterResult(adapterResult)
    return {
        config: normalizedAdapterResult.config,
        dependencies: result.dependencies,
        classNames: result.classNames,
        nativeClassNames: result.nativeClassNames,
        nativeCSS: result.nativeCSS,
        css: result.css,
        generatedCSS: result.generatedCSS,
        warnings: normalizedAdapterResult.warnings || result.warnings
    }
}

export function createCSSConfigLoader<TConfig extends object = Config>(options: CSSConfigLoaderOptions<TConfig>) {
    function loadCSSConfig(path: string, loadOptions: LoadCSSConfigOptions<TConfig> = {}) {
        const result = options.compileCSSFile(stripResourceQuery(path), {
            classes: loadOptions.classes,
            preserveNativeCSS: false
        })
        return toCSSConfigLoadResult(result, options.createConfigFromCSSDirectives(result, {
            config: loadOptions.config,
            baseConfig: loadOptions.baseConfig || options.baseConfig,
            onWarning: loadOptions.onWarning
        }))
    }

    function loadCSSConfigModule(path: string, loadOptions: LoadCSSConfigOptions<TConfig> = {}) {
        return toConfigModuleResult(loadCSSConfig(path, loadOptions))
    }

    return {
        loadCSSConfig,
        loadCSSConfigModule
    }
}
