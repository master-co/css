import type { Plugin } from 'vite'
import type { PluginContext } from '../core'
import getExtractedCSS from '../utils/extracted-css'

const CSS_REQUEST_RE = /\.css(?:\?|$)/
const CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?[^;]*;/g

export function replaceVirtualCSSImport(code: string, moduleId: string, replacement: string): { code: string, replaced: boolean } {
    let replaced = false
    const nextCode = code.replace(CSS_IMPORT_RE, (rule, _quote: string, id: string) => {
        if (id !== moduleId) return rule
        replaced = true
        return replacement
    })
    return { code: nextCode, replaced }
}

export function hasVirtualCSSImport(code: string, moduleId: string): boolean {
    return replaceVirtualCSSImport(code, moduleId, '').replaced
}

export default function VirtualCSSImportPlugin(_options: unknown, context: PluginContext): Plugin {
    return {
        name: 'master-css:static:virtual-css-import',
        enforce: 'pre',
        async transform(code, id) {
            if (id.startsWith('\0')) return
            if (!CSS_REQUEST_RE.test(id)) return

            const moduleId = context.extractor?.options.module
            if (!moduleId) return

            const isServe = context.config?.command === 'serve'
            const replacement = isServe
                ? await getExtractedCSS(context)
                : context.extractor.slotCSSRule
            const result = replaceVirtualCSSImport(code, moduleId, replacement)

            if (!result.replaced) {
                context.virtualCSSImporters?.delete(id)
                return
            }

            context.virtualCSSImporters ??= new Set()
            context.virtualCSSImporters.add(id)
            if (!isServe) {
                context.virtualCSSPlaceholderEmitted = true
            }

            return {
                code: result.code,
                map: null
            }
        }
    }
}
