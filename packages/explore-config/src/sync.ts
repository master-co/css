import { createRequire } from 'node:module'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
    DEFAULT_FOUND,
    resolveConfig,
    resolveConfigPath,
    swcTransform,
    type ExploreConfigOptions,
    type ExploreConfigResult,
    type LoadConfigOptions,
    type LoadConfigResult
} from './shared'

type CreateJiti = typeof import('jiti')['createJiti']
type TransformSync = typeof import('@swc/wasm')['transformSync']
type CompileCSSFile = typeof import('@master/css-compiler')['compileCSSFile']

const require = createRequire(import.meta.url)

function loadScriptLoaderSync() {
    return {
        createJiti: require('jiti').createJiti as CreateJiti,
        transformSync: require('@swc/wasm').transformSync as TransformSync
    }
}

function loadCompileCSSSync() {
    return require('@master/css-compiler').compileCSSFile as CompileCSSFile
}

function loadConfigModuleSync(path: string) {
    const { createJiti, transformSync } = loadScriptLoaderSync()
    const jiti = createJiti(pathToFileURL(path).href, {
        cache: false,
        debug: false,
        fsCache: false,
        moduleCache: false,
        transform: (options) => swcTransform(options, transformSync)
    })
    return jiti(path)
}

export function loadConfigSync(path: string, options: LoadConfigOptions = {}): LoadConfigResult {
    if (extname(path) === '.css') {
        const compileCSSFile = loadCompileCSSSync()
        const result = compileCSSFile(path, { classes: options.classes })
        return {
            config: result.config,
            dependencies: result.dependencies,
            classNames: result.classNames,
            nativeClassNames: result.nativeClassNames,
            css: result.css,
            generatedCSS: result.generatedCSS,
            warnings: result.warnings
        }
    }
    return {
        config: resolveConfig(loadConfigModuleSync(path), options),
        dependencies: [path]
    }
}

export function exploreConfigSync(options: ExploreConfigOptions & { name?: string } = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) return
    const result = loadConfigSync(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        ...result
    } satisfies ExploreConfigResult
}

export default exploreConfigSync
