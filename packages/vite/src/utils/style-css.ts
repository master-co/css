import {
    STYLE_CSS_REQUEST_RE,
    cleanStyleRequest,
    compileStyleCSS,
    hasMasterNoShakeDirective,
    hasMasterShakeDirective,
    hasStyleCSSImport,
    isMasterCSSModuleId,
    isMasterStyleSource,
    isStyleCSSRequest,
    registerStyleCSSSource as registerExtractorStyleCSSSource,
    removeMasterShakeDirectives,
    removeStyleCSSImports,
    replaceStyleCSSImports
} from '@master/css-extractor/style'
import type { PluginContext } from '../core'

export {
    STYLE_CSS_REQUEST_RE,
    cleanStyleRequest,
    compileStyleCSS,
    hasMasterNoShakeDirective,
    hasMasterShakeDirective,
    isMasterCSSModuleId,
    isMasterStyleSource,
    isStyleCSSRequest,
    removeMasterShakeDirectives,
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
