import baseVite, { type PluginOptions } from '@master/css.vite'
import { vueAdapter } from './adapter'

export default function masterCSS(options: PluginOptions = {}) {
    return baseVite({
        ...options,
        extractor: {
            ...options.extractor,
            adapters: [
                ...(options.extractor?.adapters || []),
                vueAdapter()
            ]
        }
    })
}

export { options, VIRTUAL_CONFIG_ID } from '@master/css.vite'
export type { PluginOptions }
