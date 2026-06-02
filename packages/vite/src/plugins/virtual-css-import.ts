import type { Plugin } from 'vite'
import { VIRTUAL_CSS_ID } from 'shared/css-virtual-module'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'
import getExtractedCSS from '../utils/extracted-css'
import {
    createStyleCSSHostSource,
    hasMasterStyleEntrypoint,
    isMasterCSSPackageStyleFile,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    resolveMasterStyleSource,
    registerStyleCSSSource
} from '../utils/style-css'

export { replaceMasterCSSImport, replaceStyleCSSImports } from '../utils/style-css'

const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID

export default function VirtualCSSImportPlugin(options: PluginOptions, context: PluginContext): Plugin {
    return {
        name: 'master-css:static:css-import',
        enforce: 'pre',
        resolveId(id) {
            if (id === VIRTUAL_CSS_ID || id === RESOLVED_VIRTUAL_CSS_ID) {
                return RESOLVED_VIRTUAL_CSS_ID
            }
        },
        async load(id) {
            if (id !== RESOLVED_VIRTUAL_CSS_ID) return
            if (options.mode !== 'extract') return ''

            context.virtualCSSImporters ??= new Set()
            context.virtualCSSImporters.add(RESOLVED_VIRTUAL_CSS_ID)

            const isServe = context.config?.command === 'serve'
            if (isServe) {
                return await getExtractedCSS(context)
            }

            context.virtualCSSPlaceholderEmitted = true
            return context.extractor.slotCSSRule
        },
        async transform(code, id) {
            if (id.startsWith('\0')) return
            if (!isStyleCSSRequest(id)) return
            if (!hasMasterStyleEntrypoint(code)) return

            if (!resolveMasterStyleSource(id, code, context.config?.root)) return

            if (isMasterCSSPackageStyleFile(id)) {
                return {
                    code: removeMasterStyleDirectives(code).code,
                    map: null
                }
            }

            if (options.mode !== 'extract') {
                return {
                    code: removeMasterStyleDirectives(code).code,
                    map: null
                }
            }

            const result = await registerStyleCSSSource(context, id, code)
            for (const dependency of result.dependencies) {
                this.addWatchFile?.(dependency)
            }

            context.virtualCSSImporters ??= new Set()
            context.virtualCSSImporters.add(RESOLVED_VIRTUAL_CSS_ID)

            return {
                code: createStyleCSSHostSource(code),
                map: null
            }
        }
    }
}
