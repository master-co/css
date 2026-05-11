import { createRequire } from 'node:module'
import { extname } from 'node:path'
import {
    DEFAULT_MISSING,
    DEFAULT_FOUND,
    resolveConfig,
    resolveConfigPath,
    type ExploreConfigOptions,
    type ExploreConfigResult,
    type LoadConfigOptions,
    type LoadConfigResult
} from './shared'
import { collectScriptDependencies, requireConfigModule } from './script'

type CompileCSSFile = typeof import('@master/css-compiler')['compileCSSFile']

const require = createRequire(import.meta.url)

function loadCompileCSSSync() {
    return require('@master/css-compiler').compileCSSFile as CompileCSSFile
}

export function loadConfigSync(path: string, options: LoadConfigOptions = {}): LoadConfigResult {
    if (extname(path) === '.css') {
        const compileCSSFile = loadCompileCSSSync()
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
        config: resolveConfig(requireConfigModule(path), options),
        dependencies: collectScriptDependencies(path)
    }
}

export function exploreConfigSync(options: ExploreConfigOptions & { name?: string } = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) {
        const missing = Object.hasOwn(options, 'missing') ? options.missing : DEFAULT_MISSING
        missing?.(options.name || 'master.css', options.cwd || '')
        return
    }
    const result = loadConfigSync(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        ...result
    } satisfies ExploreConfigResult
}

export default exploreConfigSync
