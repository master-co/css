import type { Plugin } from 'vite'
import { VIRTUAL_CSS_ID } from 'shared/css-virtual-module'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'
import getExtractedCSS from '../utils/extracted-css'
import {
    createStyleCSSHostSource,
    isMasterCSSPackageStyleFile,
    isStyleCSSRequest,
    removeMasterStyleDirectives,
    resolveMasterStyleSource
} from '@master/css-extractor/style'
import { registerStyleCSSSource } from '../utils/register-style-source'
import { getExtractor } from '../utils/extractor-context'

const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID

export default function StyleEntryPlugin(_options: PluginOptions, context: PluginContext): Plugin {
    return {
        name: 'master-css:style-entry',
        enforce: 'pre',
        resolveId(id) {
            if (id === VIRTUAL_CSS_ID || id === RESOLVED_VIRTUAL_CSS_ID) {
                return RESOLVED_VIRTUAL_CSS_ID
            }
        },
        async load(id) {
            if (id !== RESOLVED_VIRTUAL_CSS_ID) return

            context.virtualCSSImporters ??= new Set()
            context.virtualCSSImporters.add(RESOLVED_VIRTUAL_CSS_ID)

            if (context.config?.command === 'serve') {
                return await getExtractedCSS(context)
            }

            context.virtualCSSPlaceholderEmitted = true
            return getExtractor(context).slotCSSRule
        },
        async transform(code, id) {
            if (id.startsWith('\0')) return
            if (!isStyleCSSRequest(id)) return
            if (!resolveMasterStyleSource(id, code, context.config?.root)) return

            if (isMasterCSSPackageStyleFile(id, context.config?.root)) {
                return {
                    code: removeMasterStyleDirectives(code).code,
                    map: null
                }
            }

            const result = await registerStyleCSSSource(context, id, code)
            for (const dependency of result.dependencies) {
                this.addWatchFile?.(dependency)
            }

            const masterSource = context.config?.command === 'serve'
                ? await getExtractedCSS(context)
                : getExtractor(context).slotCSSRule

            if (context.config?.command === 'serve') {
                context.virtualCSSImporters ??= new Set()
                context.virtualCSSImporters.add(id)
            } else {
                context.virtualCSSPlaceholderEmitted = true
            }

            return {
                code: createStyleCSSHostSource(code, { masterSource }),
                map: null
            }
        }
    }
}
