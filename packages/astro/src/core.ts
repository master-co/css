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
import {
  createMasterCSSRuntimeBootstrapSource,
  MASTER_CSS_RUNTIME_BOOTSTRAP_ID,
  RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
} from '@master/css-build-internal/runtime-bootstrap'

export const ASTRO_MIDDLEWARE_ENTRYPOINT = '@master/css-astro/middleware'
export const ASTRO_SSR_EXTERNAL = ['@master/css-server']
export const ASTRO_RUNTIME_INJECTION = 'import "virtual:master-css-runtime";'

function createRuntimeBootstrapPlugin() {
  return {
    name: 'master-css:astro-runtime-bootstrap',
    resolveId(id: string) {
      if (id === MASTER_CSS_RUNTIME_BOOTSTRAP_ID) {
        return RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
      }
    },
    load(id: string) {
      if (id === RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID) {
        return createMasterCSSRuntimeBootstrapSource()
      }
    }
  }
}

function getViteOptions(
  options: ResolvedMasterCSSAstroIntegrationOptions
): MasterCSSVitePluginOptions {
  switch (options.mode) {
    case 'pre-render':
    case 'progressive':
      return {
        ...options,
        enabled: false
      }
    case 'runtime':
      return {
        ...options,
        runtime: false
      }
    default:
      return options
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
          vite: {
            plugins: [
              createMasterCSSVitePlugin(getViteOptions(options)) as never,
              ...(options.injectRuntime ? [createRuntimeBootstrapPlugin()] : [])
            ],
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

export default createMasterCSSAstroIntegration
