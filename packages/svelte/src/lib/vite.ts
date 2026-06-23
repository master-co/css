import baseVite, { type PluginOptions } from '@master/css.vite'
import { svelteAdapter } from './adapter.js'

export default function masterCSS(options: PluginOptions = {}) {
    return baseVite({
        mode: 'progressive',
        ...options,
        scanner: {
            ...options.scanner,
            adapters: [
                ...(options.scanner?.adapters || []),
                svelteAdapter()
            ]
        }
    })
}
