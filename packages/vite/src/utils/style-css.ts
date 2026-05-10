import {
    STYLE_CSS_REQUEST_RE,
    cleanStyleRequest,
    compileStyleCSS,
    hasStyleCSSImport,
    isMasterStyleSource,
    isStyleCSSRequest,
    registerStyleCSSSource as registerExtractorStyleCSSSource,
    removeStyleCSSImports,
    replaceStyleCSSImports
} from '@master/css-extractor/style'
import type { PluginContext } from '../core'

export {
    STYLE_CSS_REQUEST_RE,
    cleanStyleRequest,
    compileStyleCSS,
    isMasterStyleSource,
    isStyleCSSRequest,
    replaceStyleCSSImports
}

export function replaceVirtualCSSImport(code: string, moduleId: string, replacement: string) {
    return replaceStyleCSSImports(code, moduleId, replacement)
}

export function removeVirtualCSSImport(code: string, moduleId: string) {
    return removeStyleCSSImports(code, moduleId)
}

export function hasVirtualCSSImport(code: string, moduleId: string) {
    return hasStyleCSSImport(code, moduleId)
}

export async function registerStyleCSSSource(context: PluginContext, id: string, source: string): Promise<void> {
    context.styleCSSSources ??= new Map()
    await registerExtractorStyleCSSSource(context.extractor, context.styleCSSSources, id, source, {
        moduleIds: context.extractor.options.module as string,
        projectDir: context.config?.root
    })
}
