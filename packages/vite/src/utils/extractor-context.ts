import type CSSExtractor from '@master/css-extractor'
import type { PluginContext } from '../core'

export function getExtractor(context: PluginContext): CSSExtractor {
    if (!context.extractor) {
        throw new Error('[@master/css.vite] Extractor context is only available in extract mode.')
    }
    return context.extractor
}
