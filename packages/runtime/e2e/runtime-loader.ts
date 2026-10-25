import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { MasterCSSRuntime } from '../src'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSHydrationManifest } from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSRuntimeStartOptions } from '../src/types'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

interface RuntimeLoaderOptions {
  root?: Document | ShadowRoot
  manifest?: MasterCSSManifest
  /** Serve the manifest through a loader the runtime calls only when its engine starts. */
  lazyManifest?: boolean
  engine?: MasterCSSRuntimeStartOptions['engine']
  enginePrefetch?: MasterCSSRuntimeStartOptions['enginePrefetch']
  /** Await the engine after observe(), as the hydration assertions expect; deferred tests opt out. */
  ready?: boolean
  emittedGlobals?: MasterCSSEmittedGlobals
  hydrationManifest?: MasterCSSHydrationManifest
  startupTimeoutMs?: number
  stylesheetDelivery?: MasterCSSRuntimeStartOptions['stylesheetDelivery']
  stylesheets?: MasterCSSRuntimeStartOptions['stylesheets']
}

declare global {
  var __MASTER_CSS_RUNTIME_MANIFEST_LOADS__: number
  var __MASTER_CSS_RUNTIME_DIAGNOSTICS__: MasterCSSDiagnostic[]
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

function toStartOptions(options: RuntimeLoaderOptions): MasterCSSRuntimeStartOptions {
  const manifest = options.manifest || defaultManifest
  globalThis.__MASTER_CSS_RUNTIME_MANIFEST_LOADS__ = 0
  globalThis.__MASTER_CSS_RUNTIME_DIAGNOSTICS__ = []
  return {
    root: options.root,
    manifest: options.lazyManifest
      ? async () => {
        globalThis.__MASTER_CSS_RUNTIME_MANIFEST_LOADS__++
        return manifest
      }
      : manifest,
    engine: options.engine,
    enginePrefetch: options.enginePrefetch,
    hydrationManifest: options.hydrationManifest,
    emittedGlobals: options.emittedGlobals,
    startupTimeoutMs: options.startupTimeoutMs,
    stylesheetDelivery: options.stylesheetDelivery,
    stylesheets: options.stylesheets,
    onDiagnostic: diagnostic => globalThis.__MASTER_CSS_RUNTIME_DIAGNOSTICS__.push(diagnostic)
  }
}

export async function startCSSRuntime(options: RuntimeLoaderOptions = {}) {
  const runtime = await MasterCSSRuntime.start(toStartOptions(options))
  globalThis.__MASTER_CSS_RUNTIME_TEST__ = exposeRuntimeTestInternals(runtime)
  runtime.observe()
  if (options.ready !== false) await runtime.ready()
  return runtime
}

export const startCSSRuntimeAsync = startCSSRuntime
