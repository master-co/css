import { extname } from 'node:path'
import {
    DEFAULT_EXTENSIONS,
    DEFAULT_FOUND,
    DEFAULT_MISSING,
    formatMissingConfigWarning,
    resolveConfig,
    resolveConfigPath,
    warnMissingConfig,
    type ExploreConfigOptions,
    type ExploreConfigPath,
    type ExploreConfigResult,
    type LoadConfigOptions,
    type LoadConfigResult,
    type MissingConfigWarningOptions
} from './shared'
import { collectScriptDependencies, importConfigModule } from './script'

export {
    DEFAULT_EXTENSIONS,
    DEFAULT_MISSING,
    formatMissingConfigWarning,
    resolveConfigPath,
    warnMissingConfig,
    type ExploreConfigOptions,
    type ExploreConfigPath,
    type ExploreConfigResult,
    type LoadConfigOptions,
    type LoadConfigResult,
    type MissingConfigWarningOptions
}

async function loadCompileCSS() {
    return (await import('@master/css-compiler')).compileCSSFile
}

export async function loadConfig(path: string, options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
    if (extname(path) === '.css') {
        const compileCSSFile = await loadCompileCSS()
        const result = compileCSSFile(path, {
            classes: options.classes,
            preserveNativeCSS: false
        })
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
    return {
        config: resolveConfig(await importConfigModule(path), options),
        dependencies: collectScriptDependencies(path)
    }
}

export async function exploreConfig(options: ExploreConfigOptions & { name?: string } = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) {
        const missing = Object.hasOwn(options, 'missing') ? options.missing : DEFAULT_MISSING
        missing?.(options.name || 'master.css', options.cwd || '')
        return
    }
    const result = await loadConfig(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        ...result
    } satisfies ExploreConfigResult
}

export default exploreConfig
