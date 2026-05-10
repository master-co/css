import type { Plugin } from 'vite'
import type { PluginContext } from '../core'
import getExtractedCSS from '../utils/extracted-css'
import {
    isMasterStyleSource,
    isStyleCSSRequest,
    registerStyleCSSSource
} from '../utils/style-css'

export { replaceVirtualCSSImport, replaceStyleCSSImports } from '../utils/style-css'

export default function VirtualCSSImportPlugin(_options: unknown, context: PluginContext): Plugin {
    return {
        name: 'master-css:static:virtual-css-import',
        enforce: 'pre',
        async transform(code, id) {
            if (id.startsWith('\0')) return
            if (!isStyleCSSRequest(id)) return

            const moduleId = context.extractor?.options.module
            if (!moduleId) return
            if (!isMasterStyleSource(code, moduleId)) return

            await registerStyleCSSSource(context, id, code)

            const isServe = context.config?.command === 'serve'
            const replacement = isServe
                ? await getExtractedCSS(context)
                : context.extractor.slotCSSRule
            context.virtualCSSImporters ??= new Set()
            context.virtualCSSImporters.add(id)

            if (!isServe) {
                context.virtualCSSPlaceholderEmitted = true
            }

            return {
                code: replacement,
                map: null
            }
        }
    }
}
