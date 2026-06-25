import baseVite, { type PluginOptions } from '@master/css.vite'
import type { Plugin } from 'vite'
import { svelteAdapter } from './adapter.js'

export const SVELTEKIT_SSR_EXTERNAL = ['@master/css-server']

function SvelteKitServerExternalPlugin(): Plugin {
    return {
        name: 'master-css:svelte-kit-server-external',
        config() {
            return {
                ssr: {
                    external: SVELTEKIT_SSR_EXTERNAL
                },
                build: {
                    rollupOptions: {
                        external: SVELTEKIT_SSR_EXTERNAL
                    }
                }
            }
        }
    }
}

export default function masterCSS(options: PluginOptions = {}): Plugin[] {
    return [
        SvelteKitServerExternalPlugin(),
        ...baseVite({
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
    ]
}
