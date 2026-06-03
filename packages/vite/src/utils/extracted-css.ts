import { createExtractedCSS } from '@master/css-extractor/style'
import type { PluginContext } from '../core'
import { registerStyleCSSEntries } from './style-css'

export default async function getExtractedCSS(context: PluginContext): Promise<string> {
    await registerStyleCSSEntries(context)
    return createExtractedCSS({
        extractor: context.extractor,
        styleCSSSources: context.styleCSSSources,
        projectDir: context.config?.root,
        includeGeneratedCSS: context.includeGeneratedCSS
    })
}
