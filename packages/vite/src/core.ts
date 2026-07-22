import type CSSScanner from '@master/css-scanner'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { StyleCSSSources } from '@master/css-stylesheet'
import type { Plugin, ResolvedConfig } from 'vite'
import ManifestLoaderPlugin from './plugins/manifest-loader'
import ManifestVirtualModulePlugin from './plugins/manifest-virtual-module'
import EmittedGlobalsVirtualModulePlugin from './plugins/emitted-globals-virtual-module'
import ContextPlugin from './plugins/context'
import ScannerPlugin from './plugins/scanner'
import UsageGraphPlugin from './plugins/usage-graph'
import LocalComposePlugin from './plugins/local-compose'
import StyleEntryPlugin from './plugins/style-entry'
import StyleEntryHMRPlugin from './plugins/style-entry-hmr'
import StyleEntryBuildPlugin from './plugins/style-entry-build'
import defaultPluginOptions, { type PluginOptions } from './options'

export interface PluginContext {
  config?: ResolvedConfig
  scanner?: CSSScanner
  virtualCSSImporters?: Set<string>
  virtualCSSPlaceholderEmitted?: boolean
  styleCSSSources?: StyleCSSSources
  includeGeneratedCSS?: boolean
  emittedGlobals?: MasterCSSEmittedGlobals
  defaultManifestAssetReferenceId?: string
  defaultManifestAssetSource?: string
}

export default function masterCSS(options?: PluginOptions): Plugin[] {
  options = { ...defaultPluginOptions, ...options }
  const context = {
    includeGeneratedCSS: options.mode === 'static'
  } as PluginContext
  const plugins: Plugin[] = [
    ContextPlugin(options, context),
    ManifestVirtualModulePlugin(options, context),
    EmittedGlobalsVirtualModulePlugin(context),
    ManifestLoaderPlugin(context),
    ScannerPlugin(options, context),
    UsageGraphPlugin(options, context),
    LocalComposePlugin(options, context),
    StyleEntryPlugin(options, context),
    StyleEntryHMRPlugin(options, context),
    StyleEntryBuildPlugin(options, context)
  ]
  switch (options.mode) {
    case 'runtime':
      if (options.injectRuntime) {
        plugins.push(...InjectRuntimePlugins(options))
        plugins.push(RuntimePreloadPlugin(context))
        plugins.push(ManifestPreloadPlugin(context))
      }
      if (options.avoidFOUC) {
        plugins.push(AvoidFOUCPlugin(options, context))
      }
      break
    case 'static':
      break
    case 'progressive':
      plugins.push(PreRenderPlugin(options, context))
      if (options.injectRuntime) {
        plugins.push(...InjectRuntimePlugins(options))
      }
      break
    case 'pre-render':
      plugins.push(PreRenderPlugin(options, context))
      break
  }

  return plugins
}

type LazyPluginHook =
  | 'configResolved'
  | 'buildStart'
  | 'buildEnd'
  | 'closeBundle'
  | 'handleHotUpdate'
  | 'configureServer'
  | 'transform'
  | 'generateBundle'
  | 'transformIndexHtml'
  | {
    name: 'transformIndexHtml'
    order: 'pre' | 'post'
  }

type HookObject = {
  handler?: (...args: unknown[]) => unknown
}

function InjectRuntimePlugins(options: PluginOptions): Plugin[] {
  return [
    createLazyPlugin(
      {
        name: 'master-css:inject-runtime',
        enforce: 'pre',
        apply: 'build'
      },
      async () => (await import('./plugins/inject-runtime')).default(options),
      [{ name: 'transformIndexHtml', order: 'pre' }]
    ),
    createLazyPlugin(
      {
        name: 'master-css:inject-runtime:serve',
        apply: 'serve'
      },
      async () => (await import('./plugins/inject-runtime')).InjectRuntimeServePlugin(options),
      [{ name: 'transformIndexHtml', order: 'post' }]
    )
  ]
}

function ManifestPreloadPlugin(context: PluginContext): Plugin {
  return createLazyPlugin(
    {
      name: 'master-css:manifest-preload',
      apply: 'build'
    },
    async () => (await import('./plugins/manifest-preload')).default(context),
    [{ name: 'transformIndexHtml', order: 'post' }]
  )
}

function RuntimePreloadPlugin(context: PluginContext): Plugin {
  return createLazyPlugin(
    {
      name: 'master-css:runtime-preload'
    },
    async () => (await import('./plugins/runtime-preload')).default(context),
    [{ name: 'transformIndexHtml', order: 'post' }]
  )
}

function AvoidFOUCPlugin(options: PluginOptions, context: PluginContext): Plugin {
  return createLazyPlugin(
    {
      name: 'master-css:avoid-fouc',
      enforce: 'pre'
    },
    async () => (await import('./plugins/avoid-fouc')).default(options, context),
    ['transformIndexHtml', 'transform']
  )
}

function PreRenderPlugin(options: PluginOptions, context: PluginContext): Plugin {
  return createLazyPlugin(
    {
      name: 'master-css:pre-render',
      enforce: 'pre'
    },
    async () => (await import('./plugins/pre-render')).default(options, context),
    [
      'configResolved',
      'buildStart',
      'buildEnd',
      'closeBundle',
      'handleHotUpdate',
      'configureServer',
      'transformIndexHtml',
      'transform',
      'generateBundle'
    ]
  )
}

function createLazyPlugin(
  shell: Pick<Plugin, 'name' | 'enforce' | 'apply'>,
  loadPlugin: () => Promise<Plugin>,
  hooks: LazyPluginHook[]
): Plugin {
  let loadedPlugin: Plugin | undefined
  let pluginPromise: Promise<Plugin> | undefined
  const load = () => {
    if (loadedPlugin) return Promise.resolve(loadedPlugin)
    pluginPromise ||= loadPlugin().then((plugin) => {
      loadedPlugin = plugin
      return plugin
    })
    return pluginPromise
  }
  const call = (hookName: string, thisArg: unknown, args: unknown[]) => {
    if (loadedPlugin) return callLazyPluginHook(loadedPlugin, hookName, thisArg, args)
    return load().then((plugin) => callLazyPluginHook(plugin, hookName, thisArg, args))
  }
  const plugin = { ...shell } as Plugin & Record<string, unknown>

  for (const hook of hooks) {
    if (typeof hook === 'object') {
      plugin[hook.name] = {
        order: hook.order,
        handler(this: unknown, ...args: unknown[]) {
          return call(hook.name, this, args)
        }
      }
      continue
    }

    plugin[hook] = function lazyPluginHook(this: unknown, ...args: unknown[]) {
      return call(hook, this, args)
    }
  }

  return plugin
}

function callLazyPluginHook(plugin: Plugin, hookName: string, thisArg: unknown, args: unknown[]) {
  const hook = (plugin as unknown as Record<string, unknown>)[hookName]
  if (typeof hook === 'function') return hook.apply(thisArg, args)
  if (isHookObject(hook) && typeof hook.handler === 'function') {
    return hook.handler.apply(thisArg, args)
  }
}

function isHookObject(value: unknown): value is HookObject {
  return !!value && typeof value === 'object'
}
