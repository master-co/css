import baseVite, { type PluginOptions } from '@master/css.vite'
import { svelteAdapter } from './adapter.js'

export default function masterCSS(options: PluginOptions = {}) {
    return baseVite({
        ...options,
        extractor: {
            ...options.extractor,
            adapters: [
                ...(options.extractor?.adapters || []),
                svelteAdapter()
            ]
        }
    })
}
