import { createExtractedCSS } from '@master/css-extractor/style'
import type { PluginContext } from '../core'

export default async function getExtractedCSS(context: PluginContext): Promise<string> {
    return createExtractedCSS({
        extractor: context.extractor,
        styleCSSSources: context.styleCSSSources,
        projectDir: context.config?.root,
        includeGeneratedCSS: context.includeGeneratedCSS
    })
}
