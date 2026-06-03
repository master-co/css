import { createExtractedCSS } from '@master/css-extractor/style'
import type { PluginContext } from '../core'
import { getExtractor } from './extractor-context'

export default async function getExtractedCSS(context: PluginContext): Promise<string> {
    return createExtractedCSS({
        extractor: getExtractor(context),
        styleCSSSources: context.styleCSSSources,
        projectDir: context.config?.root,
        includeGeneratedCSS: context.includeGeneratedCSS
    })
}
