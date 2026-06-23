import type CSSScanner from '@master/css-scanner'
import type { PluginContext } from '../core'

export function getScanner(context: PluginContext): CSSScanner {
    if (!context.scanner) {
        throw new Error('[@master/css.vite] Scanner context was not initialized.')
    }
    return context.scanner
}
