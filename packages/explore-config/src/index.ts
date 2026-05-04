import { existsSync, readFileSync } from 'node:fs'
import { extname, parse, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Config } from '@master/css'
import { compileCSS } from '@master/postcss'
import { createJiti } from 'jiti'
import type { TransformOptions, TransformResult } from 'jiti'
import { transformSync } from '@swc/wasm'

export interface ExploreConfigOptions {
    cwd?: string
    extensions?: string[]
    resolvedKeys?: string[]
    found?: (basename: string, path: string) => void
}

export interface ExploreConfigPath {
    basename: string
    extension: string
    path: string
}

export interface ExploreConfigResult extends ExploreConfigPath {
    config: Config
}

export const DEFAULT_EXTENSIONS = [
    'js',
    'mjs',
    'ts',
    'cjs',
    'cts',
    'mts',
    'css'
]

const DEFAULT_RESOLVED_KEYS = [
    'config',
    'default'
]

const DEFAULT_FOUND = (basename: string) => process.env.DEBUG && console.log(`[Master CSS] Loaded ${basename}`)

function normalizeExtension(extension: string) {
    return extension.startsWith('.') ? extension.slice(1) : extension
}

function getKnownExtension(name: string, extensions: string[]) {
    return extensions.find((extension) => name.endsWith(`.${extension}`))
}

function resolveExistingPath(cwd: string, name: string, extension: string): ExploreConfigPath | undefined {
    const path = resolve(cwd, name)
    if (existsSync(path)) {
        return {
            basename: parse(name).base,
            extension,
            path
        }
    }
}

export function resolveConfigPath(options: ExploreConfigOptions & { name?: string } = {}): ExploreConfigPath | undefined {
    const name = options.name || 'master.css'
    const cwd = options.cwd || ''
    const extensions = (options.extensions || DEFAULT_EXTENSIONS).map(normalizeExtension)
    const knownExtension = getKnownExtension(name, extensions)
    if (knownExtension && knownExtension !== 'css') {
        const path = resolve(cwd, name)
        if (existsSync(path)) {
            return {
                basename: parse(name).base,
                extension: knownExtension,
                path
            }
        }
        return
    }
    for (const extension of extensions) {
        if (extension === 'css' && knownExtension === 'css') {
            const resolvedPath = resolveExistingPath(cwd, name, extension)
            if (resolvedPath) return resolvedPath
            continue
        }
        const basename = `${name}.${extension}`
        const path = resolve(cwd, basename)
        if (existsSync(path)) {
            return {
                basename,
                extension,
                path
            }
        }
    }
}

function swcTransform(options: TransformOptions): TransformResult {
    const filename = options.filename || ''
    const extension = extname(filename)
    const isTypeScript = options.ts || extension === '.ts' || extension === '.tsx' || extension === '.mts' || extension === '.cts'
    const isJSX = options.jsx || extension === '.jsx' || extension === '.tsx'
    const output = transformSync(options.source, {
        filename,
        sourceMaps: false,
        jsc: {
            target: 'es2022',
            parser: isTypeScript
                ? {
                    syntax: 'typescript',
                    tsx: Boolean(isJSX),
                    decorators: true,
                    dynamicImport: true
                }
                : {
                    syntax: 'ecmascript',
                    jsx: Boolean(isJSX),
                    decorators: true,
                    dynamicImport: true
                }
        },
        module: {
            type: 'commonjs',
            importInterop: 'swc'
        }
    })
    return {
        code: output.code
    }
}

function loadConfigModule(path: string) {
    const jiti = createJiti(pathToFileURL(path).href, {
        cache: false,
        debug: false,
        fsCache: false,
        moduleCache: false,
        transform: swcTransform
    })
    return jiti(path)
}

export function loadConfig(path: string, options: Pick<ExploreConfigOptions, 'resolvedKeys'> = {}) {
    if (extname(path) === '.css') {
        return compileCSS(readFileSync(path, 'utf-8'), { from: path }).config
    }
    const resolvedKeys = options.resolvedKeys || DEFAULT_RESOLVED_KEYS
    const configModule = loadConfigModule(path)
    let config: unknown
    for (const key of resolvedKeys) {
        config = configModule[key]
        if (config) break
    }
    if (!config) config = configModule
    return config as Config
}

export function exploreConfig(options: ExploreConfigOptions & { name?: string } = {}) {
    const resolvedConfig = resolveConfigPath(options)
    if (!resolvedConfig) return
    const config = loadConfig(resolvedConfig.path, options)
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return {
        ...resolvedConfig,
        config
    } satisfies ExploreConfigResult
}

export default exploreConfig
