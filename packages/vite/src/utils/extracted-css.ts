import { createExtractedCSSResult } from '@master/css-stylesheet'
import type { PluginContext } from '../core'
import { getExtractor } from './extractor-context'

export async function getExtractedCSSResult(context: PluginContext) {
    const result = await createExtractedCSSResult({
        state: getExtractor(context),
        styleCSSSources: context.styleCSSSources,
        projectDir: context.config?.root,
        includeGeneratedCSS: context.includeGeneratedCSS
    })
    context.emittedGlobals = result.emittedGlobals
    return result
}

export default async function getExtractedCSS(context: PluginContext): Promise<string> {
    return (await getExtractedCSSResult(context)).css
}
