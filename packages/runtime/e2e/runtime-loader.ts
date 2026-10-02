import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { MasterCSSRuntime } from '../src'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSHydrationManifest } from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSRuntimeStartOptions } from '../src/types'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

interface RuntimeLoaderOptions {
  root?: Document | ShadowRoot
  manifest?: MasterCSSManifest
  emittedGlobals?: MasterCSSEmittedGlobals
  hydrationManifest?: MasterCSSHydrationManifest
  startupTimeoutMs?: number
  stylesheetDelivery?: MasterCSSRuntimeStartOptions['stylesheetDelivery']
  stylesheets?: MasterCSSRuntimeStartOptions['stylesheets']
}

declare global {
  var __MASTER_CSS_RUNTIME_TEST__: MasterCSSRuntime & {
    readonly text: string
    flushRetainedClassRules(): number
  }
}

function exposeRuntimeTestInternals(runtime: MasterCSSRuntime) {
  const target = runtime as MasterCSSRuntime & {
    cleanupRetainedClassRules(force?: boolean): number
  }
  return new Proxy(target, {
    get(target, property, receiver) {
      if (property === 'text') return target.snapshot().cssText
      if (property === 'flushRetainedClassRules') {
        return () => target.cleanupRetainedClassRules(true)
      }
      return Reflect.get(target, property, receiver)
    }
  }) as typeof globalThis.__MASTER_CSS_RUNTIME_TEST__
}

export async function startCSSRuntime(options: RuntimeLoaderOptions = {}) {
  const runtime = await MasterCSSRuntime.start({
    root: options.root,
    manifest: options.manifest || defaultManifest,
    hydrationManifest: options.hydrationManifest,
    emittedGlobals: options.emittedGlobals,
    startupTimeoutMs: options.startupTimeoutMs,
    stylesheetDelivery: options.stylesheetDelivery,
    stylesheets: options.stylesheets
  })
  globalThis.__MASTER_CSS_RUNTIME_TEST__ = exposeRuntimeTestInternals(runtime)
  return runtime.observe()
}

export async function startCSSRuntimeAsync(options: RuntimeLoaderOptions = {}) {
  const cssRuntime = await MasterCSSRuntime.start({
    root: options.root,
    manifest: options.manifest || defaultManifest,
    hydrationManifest: options.hydrationManifest,
    emittedGlobals: options.emittedGlobals,
    startupTimeoutMs: options.startupTimeoutMs,
    stylesheetDelivery: options.stylesheetDelivery,
    stylesheets: options.stylesheets
  })
  globalThis.__MASTER_CSS_RUNTIME_TEST__ = exposeRuntimeTestInternals(cssRuntime)
  return cssRuntime.observe()
}
