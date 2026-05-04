import { readFileSync } from 'node:fs'
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
    type ExploreConfigResult
} from './shared'

export {
    DEFAULT_EXTENSIONS,
    resolveConfigPath,
    type ExploreConfigOptions,
    type ExploreConfigPath,
    type ExploreConfigResult
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
    return (await import('@master/css-compiler')).compileCSS
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

export async function loadConfig(path: string, options: Pick<ExploreConfigOptions, 'resolvedKeys'> = {}) {
    if (extname(path) === '.css') {
        const compileCSS = await loadCompileCSS()
        return compileCSS(readFileSync(path, 'utf-8'), { from: path }).config
    }
    return resolveConfig(await loadConfigModule(path), options)
}

export async function exploreConfig(options: ExploreConfigOptions & { name?: string } = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) return
    const config = await loadConfig(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        config
    } satisfies ExploreConfigResult
}

export default exploreConfig
