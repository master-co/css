import { extendConfig } from '@master/css/utils'
import type {
    CompileCSSFile,
    CSSDirectiveConfigAdapter,
    CSSDirectiveConfigAdapterResult
} from 'shared/css-config-loader'
import type { Config } from 'shared/css-config'
import type { CSSDirectiveResult } from 'shared/css-directives'
import type {
    LoadProjectConfigOptions,
    LoadProjectConfigResult
} from './options'

function normalizeAdapterResult<TConfig extends object>(result: CSSDirectiveConfigAdapterResult<TConfig>) {
    return 'config' in result ? result : { config: result }
}

function addUnique<T>(target: T[], values: Iterable<T> | undefined) {
    if (!values) return
    for (const value of values) {
        if (!target.includes(value)) target.push(value)
    }
}

export function createProjectConfigResult(
    entries: string[],
    results: CSSDirectiveResult[],
    createConfigFromCSSDirectives: CSSDirectiveConfigAdapter<Config>,
    options: LoadProjectConfigOptions = {}
): LoadProjectConfigResult {
    const styleConfigs: Config[] = []
    const dependencies: string[] = []
    const classNames: string[] = []
    const nativeClassNames: string[] = []
    const nativeCSS: string[] = []
    const css: string[] = []
    const generatedCSS: string[] = []
    const warnings: string[] = []
    for (const result of results) {
        addUnique(dependencies, result.dependencies)
        addUnique(classNames, result.classNames)
        addUnique(nativeClassNames, result.nativeClassNames)
        if (result.nativeCSS) nativeCSS.push(result.nativeCSS)
        if (result.css) css.push(result.css)
        if (result.generatedCSS) generatedCSS.push(result.generatedCSS)
        addUnique(warnings, result.warnings)
        const adapterResult = normalizeAdapterResult(createConfigFromCSSDirectives(result, {
            config: extendConfig(...styleConfigs, options.config),
            onWarning: options.onWarning
        }))
        styleConfigs.push(adapterResult.config)
        addUnique(warnings, adapterResult.warnings)
    }
    return {
        entries,
        config: entries.length ? extendConfig(...styleConfigs, options.config) : options.config || {},
        dependencies,
        classNames,
        nativeClassNames,
        nativeCSS: nativeCSS.join('\n'),
        css: css.join('\n'),
        generatedCSS: generatedCSS.join('\n'),
        warnings
    }
}

export function compileProjectConfigEntries(
    entries: string[],
    compileCSSFile: CompileCSSFile,
    createConfigFromCSSDirectives: CSSDirectiveConfigAdapter<Config>,
    options: LoadProjectConfigOptions = {}
) {
    const results = entries.map((entry) => compileCSSFile(entry, {
        classes: options.classes,
        preserveNativeCSS: false
    }))
    return createProjectConfigResult(
        entries,
        results,
        createConfigFromCSSDirectives,
        options
    )
}
