import { AstroIntegration } from 'astro'
import vitePlugin from '@master/css.vite'
import { CSS_RUNTIME_INJECTION } from '@master/css-integration/runtime'
import defaultOptions, { type IntegrationOptions } from './options'
import { astroAdapter } from './adapter'
import { externalizeAstroHydrationManifests } from './external-hydration-manifest'

export const ASTRO_MIDDLEWARE_ENTRYPOINT = '@master/css.astro/middleware'

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

function getViteOptions(options: IntegrationOptions): IntegrationOptions {
    const viteOptions = withAstroAdapter(options)
    switch (options.mode) {
        case 'pre-render':
        case 'progressive':
            return {
                ...viteOptions,
                mode: null
            }
        case 'runtime':
            return {
                ...viteOptions,
                injectRuntime: false
            }
        default:
            return viteOptions
    }
}

export default function masterCSS(options?: IntegrationOptions): AstroIntegration {
    options = { ...defaultOptions, ...options }
    return {
        name: '@master/css.astro',
        hooks: {
            'astro:config:setup': async ({ addMiddleware, injectScript, updateConfig }) => {
                switch (options.mode) {
                    case 'progressive':
                    case 'runtime':
                        if (options.injectRuntime) {
                            injectScript('page', CSS_RUNTIME_INJECTION)
                        }
                        break
                }
                switch (options.mode) {
                    case 'pre-render':
                    case 'progressive':
                        addMiddleware({
                            order: 'pre',
                            entrypoint: ASTRO_MIDDLEWARE_ENTRYPOINT
                        })
                        break
                }
                updateConfig({ vite: { plugins: [vitePlugin(getViteOptions(options)) as never] } })
            },
            'astro:build:done': async ({ dir }) => {
                switch (options.mode) {
                    case 'pre-render':
                    case 'progressive':
                        await externalizeAstroHydrationManifests(dir)
                        break
                }
            }
        },
    }
}
