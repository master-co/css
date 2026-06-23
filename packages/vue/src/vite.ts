import baseVite, { type PluginOptions } from '@master/css.vite'
import { vueAdapter } from './adapter'

export default function masterCSS(options: PluginOptions = {}) {
    return baseVite({
        ...options,
        scanner: {
            ...options.scanner,
            adapters: [
                ...(options.scanner?.adapters || []),
                vueAdapter()
            ]
        }
    })
}

export { options } from '@master/css.vite'
export type { PluginOptions }
