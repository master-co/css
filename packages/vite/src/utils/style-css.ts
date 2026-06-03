import {
    STYLE_CSS_REQUEST_RE,
    cleanStyleRequest,
    compileStyleCSS,
    createStyleCSSHostSource,
    hasMasterNoShakeDirective,
    hasMasterShakeDirective,
    isMasterCSSPackageStyleFile,
    hasStyleCSSImport,
    isMasterCSSModuleId,
    isMasterStyleSource,
    isStyleCSSRequest,
    registerStyleCSSSource as registerExtractorStyleCSSSource,
    removeMasterStyleDirectives,
    removeMasterShakeDirectives,
    resolveMasterStyleSource,
    resolveStyleCSSImportGraph,
    removeStyleCSSImports,
    replaceStyleCSSImports
} from '@master/css-extractor/style'
import {
    findCSSConfigEntryFiles,
    hasMasterCSSConfigEntrypoint as hasMasterStyleEntrypoint
} from '@master/css-configer/css'
import type { PluginContext } from '../core'
import { readFile } from 'node:fs/promises'

export {
    STYLE_CSS_REQUEST_RE,
    cleanStyleRequest,
    compileStyleCSS,
    createStyleCSSHostSource,
    hasMasterNoShakeDirective,
    hasMasterShakeDirective,
    hasMasterStyleEntrypoint,
    isMasterCSSPackageStyleFile,
    isMasterCSSModuleId,
    isMasterStyleSource,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    removeMasterShakeDirectives,
    resolveMasterStyleSource,
    resolveStyleCSSImportGraph,
    replaceStyleCSSImports
}

export function replaceMasterCSSImport(code: string, replacement: string) {
    return replaceStyleCSSImports(code, replacement)
}

export function removeMasterCSSImport(code: string) {
    return removeStyleCSSImports(code)
}

export function hasMasterCSSImport(code: string) {
    return hasStyleCSSImport(code)
}

export async function registerStyleCSSSource(context: PluginContext, id: string, source: string) {
    context.styleCSSSources ??= new Map()
    return registerExtractorStyleCSSSource(context.extractor, context.styleCSSSources, id, source, {
        projectDir: context.config?.root
    })
}

export async function registerStyleCSSEntries(context: PluginContext, pluginContext?: { addWatchFile?: (id: string) => void }) {
    const projectDir = context.config?.root
    if (!projectDir) return
    context.styleCSSSources ??= new Map()
    const allow = context.config?.server.fs.allow
    const files = await findCSSConfigEntryFiles(projectDir)
    for (const file of files) {
        const source = await readFile(file, 'utf8')
        const result = await registerStyleCSSSource(context, file, source)
        for (const dependency of result.dependencies) {
            if (allow && !allow.includes(dependency)) allow.push(dependency)
            pluginContext?.addWatchFile?.(dependency)
        }
    }
}
