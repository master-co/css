import { AstroIntegration } from 'astro'
import type { Plugin } from 'vite'
import { default as vitePlugin, CSS_RUNTIME_INJECTIOIN } from '@master/css.vite'
import defaultOptions, { type IntegrationOptions } from './options'

export default function masterCSS(options?: IntegrationOptions): AstroIntegration {
    options = { ...defaultOptions, ...options }
    return {
        name: '@master/css.astro',
        hooks: {
            'astro:config:setup': async ({ injectScript, updateConfig }) => {
                switch (options.mode) {
                    case 'progressive':
                    case 'runtime':
                        injectScript('page', CSS_RUNTIME_INJECTIOIN)
                        updateConfig({ vite: { plugins: [vitePlugin({ ...options, injectRuntime: false }) as unknown as Plugin] } })
                        break
                    default:
                        updateConfig({ vite: { plugins: [vitePlugin(options) as unknown as Plugin] } })
                        break
                }
                switch (options.mode) {
                    case 'progressive':
                        console.warn(`[@master/css.astro] 'progressive' mode is not yet supported. Use '@master/css-server' to set up server render first.`)
                        break
                    default:
                        break
                }
            }
        },
    }
}