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
    resolveStyleCSSImportGraph,
    removeStyleCSSImports,
    replaceStyleCSSImports
} from '@master/css-extractor/style'
import type { PluginContext } from '../core'

export {
    STYLE_CSS_REQUEST_RE,
    cleanStyleRequest,
    compileStyleCSS,
    createStyleCSSHostSource,
    hasMasterNoShakeDirective,
    hasMasterShakeDirective,
    isMasterCSSPackageStyleFile,
    isMasterCSSModuleId,
    isMasterStyleSource,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    removeMasterShakeDirectives,
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
