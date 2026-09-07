import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSHydrationManifest } from '@master/css-schema/hydration-manifest'
import { MasterCSSRuntime } from './core'

type MasterCSSRuntimeHostConstructor = new (...args: any[]) => HTMLElement
type MasterCSSRuntimeManifest = MasterCSSManifest | ((host: HTMLElement) => MasterCSSManifest)
type MasterCSSRuntimeRoot = ShadowRoot | ((host: HTMLElement) => ShadowRoot | null | undefined)
type MasterCSSRuntimeEmittedGlobals = MasterCSSEmittedGlobals | ((host: HTMLElement) => MasterCSSEmittedGlobals | undefined)
type MasterCSSRuntimeHydrationManifest = MasterCSSHydrationManifest | ((host: HTMLElement) => MasterCSSHydrationManifest | undefined)

export interface WithMasterCSSRuntimeOptions {
  readonly manifest: MasterCSSRuntimeManifest
  readonly root?: MasterCSSRuntimeRoot
  readonly emittedGlobals?: MasterCSSRuntimeEmittedGlobals
  readonly hydrationManifest?: MasterCSSRuntimeHydrationManifest
}

function resolveManifest(host: HTMLElement, manifest: MasterCSSRuntimeManifest): MasterCSSManifest {
  return typeof manifest === 'function' ? manifest(host) : manifest
}

function resolveRoot(host: HTMLElement, root: MasterCSSRuntimeRoot | undefined): ShadowRoot | null | undefined {
  return typeof root === 'function'
    ? root(host)
    : root || host.shadowRoot
}

function resolveEmittedGlobals(host: HTMLElement, emittedGlobals: MasterCSSRuntimeEmittedGlobals | undefined): MasterCSSEmittedGlobals | undefined {
  return typeof emittedGlobals === 'function' ? emittedGlobals(host) : emittedGlobals
}

function resolveHydrationManifest(host: HTMLElement, hydrationManifest: MasterCSSRuntimeHydrationManifest | undefined): MasterCSSHydrationManifest | undefined {
  return typeof hydrationManifest === 'function' ? hydrationManifest(host) : hydrationManifest
}

export function withMasterCSSRuntime(
  options: WithMasterCSSRuntimeOptions
): <T extends MasterCSSRuntimeHostConstructor>(target: T) => T {
  return function <T extends MasterCSSRuntimeHostConstructor>(target: T): T {
    const connectedCallback = target.prototype.connectedCallback as (() => void) | undefined
    const disconnectedCallback = target.prototype.disconnectedCallback as (() => void) | undefined

    return class extends target {
      masterCSSRuntime?: MasterCSSRuntime

      connectedCallback() {
        connectedCallback?.call(this)
        const root = resolveRoot(this, options.root)
        if (!root) {
          throw new Error('withMasterCSSRuntime() requires a shadow root. Provide options.root or create a shadow root before connectedCallback() finishes.')
        }
        const pendingRuntime = MasterCSSRuntime.start({
          manifest: resolveManifest(this, options.manifest),
          root,
          emittedGlobals: resolveEmittedGlobals(this, options.emittedGlobals),
          hydrationManifest: resolveHydrationManifest(this, options.hydrationManifest),
          onDiagnostic: diagnostic => console.error(diagnostic)
        })
        void pendingRuntime.then((runtime) => {
          if (!this.isConnected) {
            runtime.dispose()
            return
          }
          this.masterCSSRuntime = runtime
          runtime.observe()
        }).catch(() => {})
      }

      disconnectedCallback() {
        disconnectedCallback?.call(this)
        this.masterCSSRuntime?.dispose()
        this.masterCSSRuntime = undefined
      }
    }
  }
}
