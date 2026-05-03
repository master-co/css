import { existsSync } from 'node:fs'
import { extname, parse, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Config } from '@master/css'
import { createJiti } from 'jiti'
import type { TransformOptions, TransformResult } from 'jiti'
import { transformSync } from '@swc/wasm'

export interface ExploreConfigOptions {
    cwd?: string
    extensions?: string[]
    resolvedKeys?: string[]
    found?: (basename: string, path: string) => void
}

const DEFAULT_EXTENSIONS = [
    'js',
    'mjs',
    'ts',
    'cjs',
    'cts',
    'mts'
]

const DEFAULT_RESOLVED_KEYS = [
    'config',
    'default'
]

const DEFAULT_FOUND = (basename: string) => process.env.DEBUG && console.log(`[Master CSS] Loaded ${basename}`)

function normalizeExtension(extension: string) {
    return extension.startsWith('.') ? extension.slice(1) : extension
}

function hasKnownExtension(name: string, extensions: string[]) {
    return extensions.some((extension) => name.endsWith(`.${extension}`))
}

function resolveConfigPath(name: string, options: ExploreConfigOptions, extensions: string[]) {
    const cwd = options.cwd || ''
    if (hasKnownExtension(name, extensions)) {
        const path = resolve(cwd, name)
        if (existsSync(path)) {
            return {
                basename: parse(name).base,
                path
            }
        }
        return
    }
    for (const extension of extensions) {
        const basename = `${name}.${extension}`
        const path = resolve(cwd, basename)
        if (existsSync(path)) {
            return {
                basename,
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

export default function exploreConfig(options: ExploreConfigOptions & { name?: string } = {}) {
    const name = options.name || 'master.css'
    const extensions = (options.extensions || DEFAULT_EXTENSIONS).map(normalizeExtension)
    const resolvedKeys = options.resolvedKeys || DEFAULT_RESOLVED_KEYS
    const resolvedConfig = resolveConfigPath(name, options, extensions)
    if (!resolvedConfig) return
    const configModule = loadConfigModule(resolvedConfig.path)
    let config: unknown
    for (const key of resolvedKeys) {
        config = configModule[key]
        if (config) break
    }
    if (!config) config = configModule
    const found = Object.hasOwn(options, 'found') ? options.found : DEFAULT_FOUND
    found?.(resolvedConfig.basename, resolvedConfig.path)
    return config as Config | undefined
}
