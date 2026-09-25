import type { AstroIntegration } from 'astro'
import {
  createMasterCSSVitePlugin,
  type MasterCSSVitePluginOptions
} from '@master/css-vite'
import {
  resolveMasterCSSAstroIntegrationOptions,
  type MasterCSSAstroIntegrationOptions,
  type ResolvedMasterCSSAstroIntegrationOptions
} from './options'
import { externalizeAstroHydrationManifests } from './external-hydration-manifest'
import { preloadAstroRuntimeAssets } from './runtime-preload'
export const ASTRO_MIDDLEWARE_ENTRYPOINT = '@master/css-astro/middleware'
export const ASTRO_SSR_EXTERNAL = ['@master/css-server']
export const ASTRO_RUNTIME_INJECTION = 'import "virtual:master-css-runtime";'

function getViteOptions(options: ResolvedMasterCSSAstroIntegrationOptions): MasterCSSVitePluginOptions {
  return {
    enabled: options.enabled,
    mode: options.mode,
    scanner: options.scanner,
    pruneNativeCSS: options.pruneNativeCSS,
    runtime: options.runtime
  }
}

export function createMasterCSSAstroIntegration(
  specifiedOptions: MasterCSSAstroIntegrationOptions = {}
): AstroIntegration {
  const options = resolveMasterCSSAstroIntegrationOptions(specifiedOptions)
  if (!options.enabled) {
    return {
      name: '@master/css-astro',
      hooks: {}
    }
  }
  let astroBase: string | undefined
  let buildOutput: 'static' | 'server' | undefined
  return {
    name: '@master/css-astro',
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
          build: {
            // Master CSS may split referenced local styles into a CSS import
            // graph. Astro's inline CSS mode loses the asset base for those
            // imports, so keep the entry stylesheet external.
            inlineStylesheets: 'never'
          },
          vite: {
            define: { __MASTER_CSS_ASTRO_PROGRESSIVE__: JSON.stringify(options.mode === 'progressive') },
            // Vite owns one manifest/emitted-globals pipeline. Astro owns
            // HTML rendering and injection, so omit only the corresponding hooks.
            plugins: createMasterCSSVitePlugin(getViteOptions(options)).filter(plugin => ![
              'master-css:pre-render',
              'master-css:inject-runtime',
              'master-css:inject-runtime:serve',
              'master-css:runtime-preload',
              'master-css:manifest-preload'
            ].includes(plugin.name)) as never,
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
          case 'progressive':
            await externalizeAstroHydrationManifests(dir, astroBase)
            break
        }
      }
    },
  }
}

export default createMasterCSSAstroIntegration
