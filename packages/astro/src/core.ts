import { AstroIntegration } from 'astro'
import vitePlugin from '@master/css.vite'
import defaultOptions, { type IntegrationOptions } from './options'
import { astroAdapter } from './adapter'
import { externalizeAstroHydrationManifests } from './external-hydration-manifest'
import { preloadAstroRuntimeAssets } from './runtime-preload'

export const ASTRO_MIDDLEWARE_ENTRYPOINT = '@master/css.astro/middleware'
export const ASTRO_SSR_EXTERNAL = ['@master/css-server']
export const ASTRO_RUNTIME_INJECTION = 'import "@master/css.vite/runtime";'

function withAstroAdapter(options: IntegrationOptions): IntegrationOptions {
    return {
        ...options,
        scanner: {
            ...options.scanner,
            adapters: [
                ...(options.scanner?.adapters || []),
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
    let astroBase: string | undefined
    let buildOutput: 'static' | 'server' | undefined
    return {
        name: '@master/css.astro',
        hooks: {
            'astro:config:setup': async ({ addMiddleware, injectScript, updateConfig }) => {
                switch (options.mode) {
                    case 'progressive':
                    case 'runtime':
                        if (options.injectRuntime) {
                            injectScript('page', ASTRO_RUNTIME_INJECTION)
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
                updateConfig({
                    vite: {
                        plugins: [vitePlugin(getViteOptions(options)) as never],
                        ssr: {
                            external: ASTRO_SSR_EXTERNAL
                        },
                        build: {
                            rollupOptions: {
                                external: ASTRO_SSR_EXTERNAL
                            }
                        }
                    }
                })
            },
            'astro:config:done': async ({ config, buildOutput: output }) => {
                astroBase = config.base
                buildOutput = output
            },
            'astro:build:done': async ({ dir }) => {
                if (options.mode === 'runtime' && options.injectRuntime && buildOutput !== 'server') {
                    await preloadAstroRuntimeAssets(dir, astroBase)
                }
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
