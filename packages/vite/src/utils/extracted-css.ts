import { createExtractedCSSResult } from '@master/css-extractor/style'
import type { PluginContext } from '../core'
import { getExtractor } from './extractor-context'

export async function getExtractedCSSResult(context: PluginContext) {
    const result = await createExtractedCSSResult({
        extractor: getExtractor(context),
        styleCSSSources: context.styleCSSSources,
        projectDir: context.config?.root,
        includeGeneratedCSS: context.includeGeneratedCSS
    })
    context.preloaded = result.preloaded
    return result
}

export default async function getExtractedCSS(context: PluginContext): Promise<string> {
    return (await getExtractedCSSResult(context)).css
}
