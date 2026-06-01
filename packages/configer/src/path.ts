import { existsSync } from 'node:fs'
import { parse, resolve } from 'node:path'

export interface ExploreConfigOptions {
    cwd?: string
    name?: string
    extensions?: string[]
    resolvedKeys?: string[]
    found?: (basename: string, path: string) => void
    missing?: (name: string, cwd: string) => void
}

export interface ExploreConfigPath {
    basename: string
    extension: string
    path: string
}

export const DEFAULT_EXTENSIONS = [
    'css',
    'js',
    'mjs',
    'ts',
    'mts'
]

export const DEFAULT_FOUND = (basename: string) => process.env.DEBUG && console.log(`[Master CSS] Loaded ${basename}`)
export const DEFAULT_MISSING = undefined

const warnedMissingConfigs = new Set<string>()

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

export function resolveConfigPath(options: ExploreConfigOptions = {}): ExploreConfigPath | undefined {
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

export interface MissingConfigWarningOptions {
    name?: string
    cwd?: string
    integration?: string
    force?: boolean
}

export function formatMissingConfigWarning(options: MissingConfigWarningOptions = {}) {
    const name = options.name || 'master.css'
    const cwd = resolve(options.cwd || '')
    const integration = options.integration || 'Master CSS'
    const entryPath = resolve(cwd, name)
    return [
        `[${integration}] ${name} was not found in ${cwd}.`,
        `Create ${entryPath} and import your project stylesheet entry from it, for example:`,
        '  @import "./src/globals.css";',
        'Master CSS uses this file as the workspace entry for integrations, language service, and VS Code. Only @master blocks are read as config from imported CSS.',
        'https://rc.css.master.co/messages/missing-master-css'
    ].join('\n')
}

export function warnMissingConfig(options: MissingConfigWarningOptions = {}) {
    if (!options.force && (process.env.NODE_ENV === 'test' || process.env.VITEST)) return

    const name = options.name || 'master.css'
    const cwd = resolve(options.cwd || '')
    const integration = options.integration || 'Master CSS'
    const key = `${integration}\0${cwd}\0${name}`
    if (warnedMissingConfigs.has(key)) return

    warnedMissingConfigs.add(key)
    console.warn(formatMissingConfigWarning({
        ...options,
        cwd,
        name,
        integration
    }))
}
