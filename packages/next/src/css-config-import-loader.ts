import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { isCSSConfigRequest } from '@master/css-configer/css'
import { loadConfigModuleSync } from '@master/css-configer/load-sync'
import {
    isMasterCSSConfigRequest,
    stripMasterCSSConfigQuery,
    toVirtualCSSConfigModulePath
} from '@master/css-integration/config-module'

const MASTER_CSS_CONFIG_IMPORT_PATTERN = /(\bimport\s+(?:[^'"]*?\s+from\s*)?|\bexport\s+[^'"]*?\s+from\s*|\bimport\s*\(\s*)(['"])([^'"]+)\2/g

interface LoaderContext {
    resourcePath: string
    rootContext?: string
    addDependency?: (file: string) => void
    async?: () => (error: Error | null, content?: string) => void
    getOptions?: () => {
        projectDir?: string
    }
    resolve?: (context: string, request: string, callback: (error: Error | null, result?: string) => void) => void
}

function toModuleSpecifier(from: string, to: string) {
    const specifier = relative(dirname(from), to).replace(/\\/g, '/')
    return specifier.startsWith('../') ? specifier : `./${specifier}`
}

function resolveRequest(context: LoaderContext, request: string) {
    return new Promise<string>((resolveRequest, reject) => {
        if (context.resolve) {
            context.resolve(dirname(context.resourcePath), request, (error, result) => {
                if (error) {
                    reject(error)
                    return
                }
                if (result) {
                    resolveRequest(result)
                    return
                }
                reject(new Error(`Unable to resolve ${request}`))
            })
            return
        }

        if (isAbsolute(request)) {
            resolveRequest(request)
            return
        }

        if (request.startsWith('./') || request.startsWith('../')) {
            resolveRequest(resolve(dirname(context.resourcePath), request))
            return
        }

        resolveRequest(createRequire(context.resourcePath).resolve(request))
    })
}

function writeCSSConfigModule(context: LoaderContext, configPath: string) {
    if (!isCSSConfigRequest(configPath)) {
        throw new TypeError('Master CSS config queries only support CSS entry files.')
    }

    const projectDir = context.getOptions?.().projectDir || context.rootContext || process.cwd()
    const virtualConfigPath = toVirtualCSSConfigModulePath(projectDir, configPath)
    const result = loadConfigModuleSync(configPath)
    mkdirSync(dirname(virtualConfigPath), { recursive: true })
    writeFileSync(virtualConfigPath, result.code)
    for (const dependency of result.dependencies) {
        context.addDependency?.(dependency)
    }
    return virtualConfigPath
}

async function transformConfigImports(context: LoaderContext, source: string) {
    let result = ''
    let lastIndex = 0
    let matched = false

    for (const match of source.matchAll(MASTER_CSS_CONFIG_IMPORT_PATTERN)) {
        const [fullMatch, prefix, quote, request] = match
        if (!isMasterCSSConfigRequest(request)) continue
        if (match.index === undefined) continue

        matched = true
        const configPath = await resolveRequest(context, stripMasterCSSConfigQuery(request))
        const virtualConfigPath = writeCSSConfigModule(context, configPath)
        result += source.slice(lastIndex, match.index)
        result += `${prefix}${quote}${toModuleSpecifier(context.resourcePath, virtualConfigPath)}${quote}`
        lastIndex = match.index + fullMatch.length
    }

    if (!matched) return source
    return result + source.slice(lastIndex)
}

export default function masterCSSConfigImportLoader(this: LoaderContext, source: string) {
    const callback = this.async?.()
    if (!callback) {
        throw new Error('[@master/css.next] CSS config import loader requires an async loader context.')
    }

    transformConfigImports(this, source)
        .then((code) => callback(null, code))
        .catch((error: Error) => callback(error))
}
