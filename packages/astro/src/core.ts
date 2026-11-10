import type { AstroIntegration } from 'astro'
import {
  createMasterCSSVitePlugin,
  type MasterCSSVitePluginOptions
} from '@master/css-vite'
import { mergeEmittedGlobals } from '@master/css-internal/emitted-globals-module'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import {
  resolveMasterCSSAstroIntegrationOptions,
  type MasterCSSAstroIntegrationOptions,
  type ResolvedMasterCSSAstroIntegrationOptions
} from './options'
import { externalizeAstroHydrationManifests } from './external-hydration-manifest'
import { preloadAstroRuntimeAssets, type AstroAssetsPrefix } from './runtime-preload'
import { describeOutputStylesheets } from './output-stylesheets'
import { providePrerenderStylesheets } from './prerender-stylesheets'
export const ASTRO_MIDDLEWARE_ENTRYPOINT = '@master/css-astro/middleware'
export const ASTRO_SSR_EXTERNAL = ['@master/css-server']
export const ASTRO_RUNTIME_INJECTION = 'import "virtual:master-css-runtime";'

// Astro owns HTML rendering and injection through its middleware and build hooks.
const ASTRO_OMITTED_VITE_PLUGINS = new Set([
  'master-css:prerender',
  'master-css:inject-runtime',
  'master-css:inject-runtime:serve',
  'master-css:runtime-preload',
  'master-css:manifest-preload'
])
const MANIFEST_MODULE_PLUGINS = new Set([
  'master-css:virtual-module:manifest',
  'master-css:manifest-loader'
])
const EMITTED_GLOBALS_PLUGIN = 'master-css:virtual-module:emitted-globals'

// Use the plugin type @master/css-vite produces; Astro may resolve another Vite instance.
type Plugin = ReturnType<typeof createMasterCSSVitePlugin>[number]
type EnvironmentApplication = NonNullable<Plugin['applyToEnvironment']>
type PluginContext = { environment?: { config: { consumer?: string } }, emitFile?: unknown }
type BuildEnvironment = { name: string, config: { consumer?: string } }
/** The emitted-globals plugin's `api` from @master/css-vite. */
export type EmittedGlobalsPluginAPI = {
  finalize?: (environment: BuildEnvironment, emittedGlobals: Required<MasterCSSEmittedGlobals>) => MasterCSSEmittedGlobals
}

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

/**
 * Astro links the CSS its server environments process on pages whose runtime
 * the client environment bundles without importing that CSS. Astro builds the
 * server environments first, so the client bundle also counts their emitted
 * globals, as a Vite runtime bundle counts the CSS delivered beside it.
 */
export function deliverServerEmittedGlobals(plugins: readonly Plugin[]) {
  const api = plugins.find(plugin => plugin.name === EMITTED_GLOBALS_PLUGIN)?.api as EmittedGlobalsPluginAPI | undefined
  if (!api) return
  const server = new Map<string, MasterCSSEmittedGlobals>()
  api.finalize = (environment, emittedGlobals) => {
    if (environment.config.consumer === 'client') return mergeEmittedGlobals(emittedGlobals, ...server.values())
    server.set(environment.name, emittedGlobals)
    return emittedGlobals
  }
}

export function createAstroVitePlugins(options: MasterCSSVitePluginOptions, isStaticOutput?: () => boolean): Plugin[] {
  const plugins = createMasterCSSVitePlugin(options)
  // Progressive hydration manifests carry each page's emitted globals instead;
  // a union across server environments could claim more than a page links.
  if (options.mode === 'runtime') deliverServerEmittedGlobals(plugins)
  return plugins
    .filter(plugin => !ASTRO_OMITTED_VITE_PLUGINS.has(plugin.name))
    .map(inlineServerManifests)
    .map(plugin => {
      if ((options.mode ?? 'static') !== 'static' || !isStaticOutput || plugin.name !== 'master-css:usage-graph') return plugin
      const apply = plugin.apply
      if (typeof apply !== 'function') return plugin
      return {
        ...plugin,
        // Astro bundles its static pages and their linked CSS on the server.
        // Include those modules before the stylesheet is finalized.
        apply: (config, env) => (env.command === 'build' && env.isSsrBuild && isStaticOutput()) || apply(config, env)
      }
    })
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
  let astroAssetsPrefix: AstroAssetsPrefix | undefined
  let buildOutput: 'static' | 'server' | undefined
  let getBuildOutput: (() => 'static' | 'server') | undefined
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
          case 'prerender':
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
            plugins: createAstroVitePlugins(getViteOptions(options), () => getBuildOutput?.() === 'static') as never,
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
      'astro:config:done': async context => {
        const { config, buildOutput: output } = context
        // Another integration can still register an adapter and change the output.
        getBuildOutput = () => context.buildOutput
        astroBase = config.base
        astroAssetsPrefix = config.build?.assetsPrefix as AstroAssetsPrefix | undefined
        buildOutput = output
        clientDir = output === 'static' ? config.outDir : config.build?.client
      },
      'astro:build:start': () => {
        outputStylesheets = undefined
        if (options.mode !== 'prerender' && options.mode !== 'progressive') return
        providePrerenderStylesheets({
          stylesheets: () => outputStylesheets ??= describeOutputStylesheets(clientDir!, astroBase)
        })
      },
      'astro:build:done': async ({ dir }) => {
        providePrerenderStylesheets(undefined)
        if (options.mode === 'runtime' && options.injectRuntime && buildOutput !== 'server') {
          await preloadAstroRuntimeAssets(dir, astroBase, astroAssetsPrefix)
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
