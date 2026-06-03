import { registerStyleCSSSource as registerExtractorStyleCSSSource } from '@master/css-extractor/style'
import type { PluginContext } from '../core'
import { getExtractor } from './extractor-context'

export async function registerStyleCSSSource(context: PluginContext, id: string, source: string) {
    context.styleCSSSources ??= new Map()
    return registerExtractorStyleCSSSource(getExtractor(context), context.styleCSSSources, id, source, {
        projectDir: context.config?.root
    })
}
