import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
    DEFAULT_EXTENSIONS,
    DEFAULT_FOUND,
    resolveConfig,
    resolveConfigPath,
    swcTransform,
    type ExploreConfigOptions,
    type ExploreConfigPath,
    type ExploreConfigResult,
    type LoadConfigResult
} from './shared'

export {
    DEFAULT_EXTENSIONS,
    resolveConfigPath,
    type ExploreConfigOptions,
    type ExploreConfigPath,
    type ExploreConfigResult,
    type LoadConfigResult
}

type CreateJiti = typeof import('jiti')['createJiti']
type TransformSync = typeof import('@swc/wasm')['transformSync']

let scriptLoaderPromise: Promise<{
    createJiti: CreateJiti
    transformSync: TransformSync
}> | undefined

async function loadScriptLoader() {
    scriptLoaderPromise ||= Promise.all([
        import('jiti'),
        import('@swc/wasm')
    ]).then(([jiti, swc]) => ({
        createJiti: jiti.createJiti,
        transformSync: swc.transformSync
    }))
    return scriptLoaderPromise
}

async function loadCompileCSS() {
    return (await import('@master/css-compiler')).compileCSSFile
}

async function loadConfigModule(path: string) {
    const { createJiti, transformSync } = await loadScriptLoader()
    const jiti = createJiti(pathToFileURL(path).href, {
        cache: false,
        debug: false,
        fsCache: false,
        moduleCache: false,
        transform: (options) => swcTransform(options, transformSync)
    })
    return jiti(path)
}

export async function loadConfig(path: string, options: Pick<ExploreConfigOptions, 'resolvedKeys'> = {}): Promise<LoadConfigResult> {
    if (extname(path) === '.css') {
        const compileCSSFile = await loadCompileCSS()
        const result = compileCSSFile(path)
        return {
            config: result.config,
            dependencies: result.dependencies
        }
    }
    return {
        config: resolveConfig(await loadConfigModule(path), options),
        dependencies: [path]
    }
}

export async function exploreConfig(options: ExploreConfigOptions & { name?: string } = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) return
    const { config, dependencies } = await loadConfig(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        config,
        dependencies
    } satisfies ExploreConfigResult
}

export default exploreConfig
