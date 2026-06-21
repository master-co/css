import { registerStyleCSSSource as registerStylesheetCSSSource } from '@master/css-stylesheet'
import type { PluginContext } from '../core'
import { getExtractor } from './extractor-context'

export async function registerStyleCSSSource(context: PluginContext, id: string, source: string) {
    context.styleCSSSources ??= new Map()
    return registerStylesheetCSSSource(getExtractor(context), context.styleCSSSources, id, source, {
        projectDir: context.config?.root
    })
}
