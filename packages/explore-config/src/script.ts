import { readFileSync, realpathSync } from 'node:fs'
import { createRequire, isBuiltin, registerHooks } from 'node:module'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { parseSync, visitorKeys, type OxcError as ParserError } from 'oxc-parser'
import { ResolverFactory } from 'oxc-resolver'
import { transformSync, type OxcError, type TransformOptions } from 'oxc-transform'

const CONFIG_LOAD_ID_PARAM = 'master-css-load'
const URL_SCHEME_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/
const require = createRequire(import.meta.url)
const nativeImport = createNativeImport()

interface CompiledModule {
    exports: unknown
    filename: string
    paths: string[]
    _compile: (code: string, filename: string) => void
}

interface ModuleConstructor {
    new(id: string): CompiledModule
    _nodeModulePaths: (from: string) => string[]
}

function createNativeImport() {
    const Module = require('node:module') as ModuleConstructor
    const filename = fileURLToPath(new URL('./native-import.cjs', import.meta.url))
    const module = new Module(filename)
    module.filename = filename
    module.paths = Module._nodeModulePaths(process.cwd())
    // Keep dynamic config imports out of Vite/Vitest transforms so cache-busting query strings survive.
    module._compile('module.exports = (url) => import(url)', filename)
    return module.exports as (url: string) => Promise<Record<string, unknown>>
}

const transformExtensions = new Set([
    '.ts',
    '.mts',
    '.tsx',
    '.jsx'
])

const scriptExtensions = new Set([
    '.js',
    '.mjs',
    '.ts',
    '.mts',
    '.jsx',
    '.tsx'
])

const resolver = new ResolverFactory({
    conditionNames: [
        'node',
        'import',
        'default'
    ],
    extensionAlias: {
        '.js': [
            '.ts',
            '.tsx',
            '.js',
            '.jsx'
        ],
        '.mjs': [
            '.mts',
            '.mjs'
        ]
    },
    extensions: [
        '.ts',
        '.mts',
        '.tsx',
        '.js',
        '.mjs',
        '.jsx',
        '.json'
    ],
    tsconfig: 'auto'
})

let hooksRegistered = false
let loadId = 0

function isURLSpecifier(specifier: string) {
    return URL_SCHEME_RE.test(specifier)
}

function cleanFileURLToPath(url: string | URL) {
    const fileURL = new URL(url)
    fileURL.search = ''
    fileURL.hash = ''
    return fileURLToPath(fileURL)
}

function getLang(path: string): TransformOptions['lang'] {
    const extension = extname(path)
    if (extension === '.tsx') return 'tsx'
    if (extension === '.jsx') return 'jsx'
    if (extension === '.ts' || extension === '.mts') return 'ts'
    return 'js'
}

function isTransformable(path: string) {
    return transformExtensions.has(extname(path))
}

function isScript(path: string) {
    return scriptExtensions.has(extname(path))
}

function isNodeModulesPath(path: string) {
    return path.split(/[\\/]/).includes('node_modules')
}

function formatOxcErrors(errors: OxcError[]) {
    return errors.map((error) => error.codeframe || error.message).join('\n')
}

function formatParserErrors(errors: ParserError[]) {
    return errors.map((error) => error.codeframe || error.message).join('\n')
}

function transformModule(path: string) {
    const result = transformSync(path, readFileSync(path, 'utf8'), {
        decorator: {
            legacy: true
        },
        lang: getLang(path),
        sourceType: 'module',
        target: 'node24'
    })
    if (result.errors.length) {
        throw new Error(formatOxcErrors(result.errors))
    }
    return result.code
}

function shouldPropagateLoadId(path: string) {
    return isScript(path) && !isNodeModulesPath(path)
}

function resolveModuleRequest(importerPath: string, request: string) {
    if (isBuiltin(request) || isURLSpecifier(request)) return

    const result = (() => {
        try {
            return resolver.resolveFileSync(importerPath, request)
        } catch {
            return
        }
    })()
    if (!result || result.builtin || !result.path) return
    return preserveImporterPath(importerPath, result.path)
}

function preserveImporterPath(importerPath: string, resolvedPath: string) {
    const importerDir = dirname(importerPath)
    const relativePath = relative(realpathSync.native(importerDir), realpathSync.native(resolvedPath))
    if (relativePath && !relativePath.startsWith('..') && !isAbsolute(relativePath)) {
        return resolve(importerDir, relativePath)
    }
    return resolvedPath
}

function registerOxcHooks() {
    if (hooksRegistered) return

    registerHooks({
        resolve(specifier, context, nextResolve) {
            if (specifier.startsWith('file:')) {
                return {
                    shortCircuit: true,
                    url: specifier
                }
            }

            if (isBuiltin(specifier) || isURLSpecifier(specifier) || !context.parentURL?.startsWith('file:')) {
                return nextResolve(specifier, context)
            }

            const resolvedPath = resolveModuleRequest(cleanFileURLToPath(context.parentURL), specifier)
            if (!resolvedPath) return nextResolve(specifier, context)

            const url = pathToFileURL(resolvedPath)
            const parentLoadId = new URL(context.parentURL).searchParams.get(CONFIG_LOAD_ID_PARAM)
            if (parentLoadId && shouldPropagateLoadId(resolvedPath)) {
                url.searchParams.set(CONFIG_LOAD_ID_PARAM, parentLoadId)
            }

            return {
                shortCircuit: true,
                url: url.href
            }
        },
        load(url, context, nextLoad) {
            const fileURL = new URL(url)
            if (fileURL.protocol === 'file:' && isTransformable(fileURL.pathname)) {
                return {
                    format: 'module',
                    shortCircuit: true,
                    source: transformModule(cleanFileURLToPath(fileURL))
                }
            }
            return nextLoad(url, context)
        }
    })

    hooksRegistered = true
}

export async function importConfigModule(path: string) {
    registerOxcHooks()

    const url = pathToFileURL(path)
    url.searchParams.set(CONFIG_LOAD_ID_PARAM, String(++loadId))
    return nativeImport(url.href)
}

export function requireConfigModule(path: string) {
    registerOxcHooks()

    delete require.cache[require.resolve(path)]
    return require(path) as Record<string, unknown>
}

function getLiteralString(node: unknown) {
    if (!node || typeof node !== 'object') return

    const value = (node as { value?: unknown }).value
    return typeof value === 'string' ? value : undefined
}

function walkNode(node: unknown, visit: (node: Record<string, unknown>) => void) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
        for (const child of node) walkNode(child, visit)
        return
    }

    const record = node as Record<string, unknown>
    visit(record)

    const type = record.type
    const keys = typeof type === 'string' ? visitorKeys[type] : undefined
    if (keys) {
        for (const key of keys) walkNode(record[key], visit)
        return
    }

    for (const value of Object.values(record)) {
        walkNode(value, visit)
    }
}

function collectModuleRequests(path: string) {
    const source = readFileSync(path, 'utf8')
    const result = parseSync(path, source, {
        lang: getLang(path),
        sourceType: 'unambiguous'
    })
    if (result.errors.length) {
        throw new Error(formatParserErrors(result.errors))
    }

    const requests = new Set<string>()

    for (const importEntry of result.module.staticImports) {
        if (importEntry.entries.length && importEntry.entries.every((entry) => entry.isType)) continue
        requests.add(importEntry.moduleRequest.value)
    }

    for (const exportEntry of result.module.staticExports) {
        for (const entry of exportEntry.entries) {
            if (entry.isType || !entry.moduleRequest) continue
            requests.add(entry.moduleRequest.value)
        }
    }

    walkNode(result.program, (node) => {
        if (node.type === 'ImportExpression') {
            const value = getLiteralString(node.source)
            if (value) requests.add(value)
        }

        if (node.type === 'CallExpression') {
            const callee = node.callee as { type?: string, name?: string } | undefined
            const args = node.arguments as unknown[] | undefined
            if (callee?.type !== 'Identifier' || callee.name !== 'require') return

            const value = getLiteralString(args?.[0])
            if (value) requests.add(value)
        }
    })

    return requests
}

export function collectScriptDependencies(path: string) {
    const dependencies: string[] = []
    const visited = new Set<string>()

    function visit(path: string) {
        if (visited.has(path)) return
        visited.add(path)
        dependencies.push(path)

        if (!isScript(path) || isNodeModulesPath(path)) return

        for (const request of collectModuleRequests(path)) {
            const resolvedPath = resolveModuleRequest(path, request)
            if (!resolvedPath || isNodeModulesPath(resolvedPath)) continue
            visit(resolvedPath)
        }
    }

    visit(path)
    return dependencies
}
