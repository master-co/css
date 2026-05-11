import { AstroIntegration } from 'astro'
import { default as vitePlugin, CSS_RUNTIME_INJECTIOIN } from '@master/css.vite'
import defaultOptions, { type IntegrationOptions } from './options'
import { astroAdapter } from './adapter'

function withAstroAdapter(options: IntegrationOptions): IntegrationOptions {
    return {
        ...options,
        extractor: {
            ...options.extractor,
            adapters: [
                ...(options.extractor?.adapters || []),
                astroAdapter()
            ]
        }
    }
}

export default function masterCSS(options?: IntegrationOptions): AstroIntegration {
    options = { ...defaultOptions, ...options }
    const viteOptions = withAstroAdapter(options)
    return {
        name: '@master/css.astro',
        hooks: {
            'astro:config:setup': async ({ injectScript, updateConfig }) => {
                switch (options.mode) {
                    case 'progressive':
                    case 'runtime':
                        injectScript('page', CSS_RUNTIME_INJECTIOIN)
                        updateConfig({ vite: { plugins: [vitePlugin({ ...viteOptions, injectRuntime: false }) as never] } })
                        break
                    default:
                        updateConfig({ vite: { plugins: [vitePlugin(viteOptions) as never] } })
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
