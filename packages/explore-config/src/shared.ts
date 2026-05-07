import { existsSync } from 'node:fs'
import { extname, parse, resolve } from 'node:path'
import type { Config } from '@master/css'
import type { TransformOptions, TransformResult } from 'jiti'

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

export interface LoadConfigResult {
    config: Config
    dependencies: string[]
}

export type ExploreConfigResult = ExploreConfigPath & LoadConfigResult

export const DEFAULT_EXTENSIONS = [
    'css',
    'js',
    'mjs',
    'ts',
    'cjs',
    'cts',
    'mts'
]

export const DEFAULT_RESOLVED_KEYS = [
    'config',
    'default'
]

export const DEFAULT_FOUND = (basename: string) => process.env.DEBUG && console.log(`[Master CSS] Loaded ${basename}`)

type TransformSync = typeof import('@swc/wasm')['transformSync']

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

export function swcTransform(options: TransformOptions, transformSync: TransformSync): TransformResult {
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

export function resolveConfig(configModule: Record<string, unknown>, options: Pick<ExploreConfigOptions, 'resolvedKeys'> = {}) {
    const resolvedKeys = options.resolvedKeys || DEFAULT_RESOLVED_KEYS
    let config: unknown
    for (const key of resolvedKeys) {
        config = configModule[key]
        if (config) break
    }
    if (!config) config = configModule
    return config as Config
}
