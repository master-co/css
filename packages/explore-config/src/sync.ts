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

export function loadConfigSync(path: string, options: Pick<ExploreConfigOptions, 'resolvedKeys'> = {}): LoadConfigResult {
    if (extname(path) === '.css') {
        const compileCSSFile = loadCompileCSSSync()
        const result = compileCSSFile(path)
        return {
            config: result.config,
            dependencies: result.dependencies
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
    const { config, dependencies } = loadConfigSync(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        config,
        dependencies
    } satisfies ExploreConfigResult
}

export default exploreConfigSync
