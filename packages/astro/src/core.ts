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
import { describeOutputStylesheets, publishNativeStylesheet, writeRuntimeStylesheetSidecars } from './output-stylesheets'
import { providePrerenderStylesheets } from './prerender-stylesheets'
export const ASTRO_MIDDLEWARE_ENTRYPOINT = '@master/css-astro/middleware'
export const ASTRO_SSR_EXTERNAL = ['@master/css-server']
export const ASTRO_RUNTIME_INJECTION = 'import "virtual:master-css-runtime";'

// Astro owns HTML rendering and injection through its middleware and build hooks.
const ASTRO_OMITTED_VITE_PLUGINS = new Set([
  'master-css:pre-render',
  'master-css:inject-runtime',
  'master-css:inject-runtime:serve',
  'master-css:runtime-preload',
  'master-css:manifest-preload'
])
const MANIFEST_MODULE_PLUGINS = new Set([
  'master-css:virtual-module:manifest',
  'master-css:manifest-loader'
])

// Use the plugin type @master/css-vite produces; Astro may resolve another Vite instance.
type Plugin = ReturnType<typeof createMasterCSSVitePlugin>[number]
type EnvironmentApplication = NonNullable<Plugin['applyToEnvironment']>
type PluginContext = { environment?: { config: { consumer?: string } }, emitFile?: unknown }

function withoutAssetEmission<T extends object>(context: T): T {
  return new Proxy(context, {
    get(target, key) {
      if (key === 'emitFile') return undefined
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    }
  })
}

function inlineServerManifestLoad(plugin: Plugin): Plugin {
  const load = plugin.load
  if (!load) return plugin
  const handler = (typeof load === 'function' ? load : load.handler) as (this: PluginContext, ...args: unknown[]) => unknown
  const inlineLoad = function (this: PluginContext, ...args: unknown[]) {
    return handler.apply(this.environment?.config.consumer === 'server' ? withoutAssetEmission(this) : this, args)
  }
  return { ...plugin, load: (typeof load === 'function' ? inlineLoad : { ...load, handler: inlineLoad }) as Plugin['load'] }
}

/**
 * Astro renders server asset URLs as public paths and moves server assets into
 * the client output before prerendering, so a server bundle cannot import an
 * emitted manifest asset. Server environments therefore receive inline manifests;
 * client environments keep the emitted asset and its preload.
 */
export function inlineServerManifests(plugin: Plugin): Plugin {
  if (!MANIFEST_MODULE_PLUGINS.has(plugin.name)) return plugin
  const applyToEnvironment = plugin.applyToEnvironment
  const applyInlineServerManifests = async function (this: unknown, environment: Parameters<EnvironmentApplication>[0]) {
    const applied = applyToEnvironment ? await applyToEnvironment.call(this as never, environment) : true
    if (!applied || applied === true || Array.isArray(applied)) return applied
    return environment.config.consumer === 'server' ? inlineServerManifestLoad(applied as Plugin) : applied
  }
  return {
    ...inlineServerManifestLoad(plugin),
    applyToEnvironment: applyInlineServerManifests as EnvironmentApplication
  }
}

export function createAstroVitePlugins(options: MasterCSSVitePluginOptions) {
  return createMasterCSSVitePlugin(options)
    .filter(plugin => !ASTRO_OMITTED_VITE_PLUGINS.has(plugin.name))
    .map(inlineServerManifests)
}

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
  let clientDir: URL | undefined
  let outputStylesheets: ReturnType<typeof describeOutputStylesheets> | undefined
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
            // Vite owns one manifest/emitted-globals pipeline.
            plugins: createAstroVitePlugins(getViteOptions(options)) as never,
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
        clientDir = output === 'static' ? config.outDir : config.build?.client
      },
      'astro:build:start': () => {
        outputStylesheets = undefined
        if (options.mode !== 'pre-render' && options.mode !== 'progressive') return
        providePrerenderStylesheets({
          stylesheets: () => outputStylesheets ??= describeOutputStylesheets(clientDir!, astroBase),
          publishImport: css => publishNativeStylesheet(clientDir!, astroBase ?? '/', css)
        })
      },
      'astro:build:done': async ({ dir }) => {
        providePrerenderStylesheets(undefined)
        if (options.injectRuntime) {
          // Describe again: prerendering may have published native stylesheet imports.
          await writeRuntimeStylesheetSidecars(await describeOutputStylesheets(dir, astroBase))
        }
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
