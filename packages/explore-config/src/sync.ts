import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
    DEFAULT_FOUND,
    resolveConfig,
    resolveConfigPath,
    swcTransform,
    type ExploreConfigOptions,
    type ExploreConfigResult
} from './shared'

type CreateJiti = typeof import('jiti')['createJiti']
type TransformSync = typeof import('@swc/wasm')['transformSync']
type CompileCSS = typeof import('@master/css-compiler')['compileCSS']

const require = createRequire(import.meta.url)

function loadScriptLoaderSync() {
    return {
        createJiti: require('jiti').createJiti as CreateJiti,
        transformSync: require('@swc/wasm').transformSync as TransformSync
    }
}

function loadCompileCSSSync() {
    return require('@master/css-compiler').compileCSS as CompileCSS
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

export function loadConfigSync(path: string, options: Pick<ExploreConfigOptions, 'resolvedKeys'> = {}) {
    if (extname(path) === '.css') {
        const compileCSS = loadCompileCSSSync()
        return compileCSS(readFileSync(path, 'utf-8'), { from: path }).config
    }
    return resolveConfig(loadConfigModuleSync(path), options)
}

export function exploreConfigSync(options: ExploreConfigOptions & { name?: string } = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) return
    const config = loadConfigSync(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        config
    } satisfies ExploreConfigResult
}

export default exploreConfigSync
