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
    hasMasterCSSConfigEntrypoint as hasMasterStyleEntrypoint
} from '@master/css-configer/css'
import type { PluginContext } from '../core'
import { getExtractor } from './extractor-context'

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
    return registerExtractorStyleCSSSource(getExtractor(context), context.styleCSSSources, id, source, {
        projectDir: context.config?.root
    })
}
