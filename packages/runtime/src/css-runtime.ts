import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-engine'
import type { MasterCSSHydrationManifest } from '@master/css-schema/hydration-manifest'
import CSSRuntime from './core'

type CSSRuntimeHostConstructor = new (...args: any[]) => HTMLElement
type CSSRuntimeManifest = MasterCSSManifest | ((host: HTMLElement) => MasterCSSManifest)
type CSSRuntimeRoot = ShadowRoot | ((host: HTMLElement) => ShadowRoot | null | undefined)
type CSSRuntimeEmittedGlobals = MasterCSSEmittedGlobals | ((host: HTMLElement) => MasterCSSEmittedGlobals | undefined)
type CSSHydrationManifest = MasterCSSHydrationManifest | ((host: HTMLElement) => MasterCSSHydrationManifest | undefined)

export interface CSSRuntimeOptions {
  manifest: CSSRuntimeManifest
  root?: CSSRuntimeRoot
  emittedGlobals?: CSSRuntimeEmittedGlobals
  hydrationManifest?: CSSHydrationManifest
}

export type CSSRuntimeDecoratorOptions = CSSRuntimeOptions

function resolveManifest(host: HTMLElement, manifest: CSSRuntimeManifest): MasterCSSManifest {
  return typeof manifest === 'function' ? manifest(host) : manifest
}

function resolveRoot(host: HTMLElement, root: CSSRuntimeRoot | undefined): ShadowRoot | null | undefined {
  return typeof root === 'function'
    ? root(host)
    : root || host.shadowRoot
}

function resolveEmittedGlobals(host: HTMLElement, emittedGlobals: CSSRuntimeEmittedGlobals | undefined): MasterCSSEmittedGlobals | undefined {
  return typeof emittedGlobals === 'function' ? emittedGlobals(host) : emittedGlobals
}

function resolveHydrationManifest(host: HTMLElement, hydrationManifest: CSSHydrationManifest | undefined): MasterCSSHydrationManifest | undefined {
  return typeof hydrationManifest === 'function' ? hydrationManifest(host) : hydrationManifest
}

export default function cssRuntime(options: CSSRuntimeOptions): <T extends CSSRuntimeHostConstructor>(target: T) => T {
  return function <T extends CSSRuntimeHostConstructor>(target: T): T {
    const connectedCallback = target.prototype.connectedCallback as (() => void) | undefined
    const disconnectedCallback = target.prototype.disconnectedCallback as (() => void) | undefined

    return class extends target {
      cssRuntime?: CSSRuntime

      connectedCallback() {
        connectedCallback?.call(this)
        const root = resolveRoot(this, options.root)
        if (!root) {
          throw new Error('`@cssRuntime()` requires a shadow root. Provide `options.root` or create a shadow root before `connectedCallback()` finishes.')
        }
        const pendingRuntime = CSSRuntime.start({
          manifest: resolveManifest(this, options.manifest),
          root,
          emittedGlobals: resolveEmittedGlobals(this, options.emittedGlobals),
          hydrationManifest: resolveHydrationManifest(this, options.hydrationManifest),
          onError: diagnostic => console.error(diagnostic)
        })
        void pendingRuntime.then((cssRuntime) => {
          if (!this.isConnected) {
            cssRuntime.destroy()
            return
          }
          this.cssRuntime = cssRuntime
          cssRuntime.observe()
        }).catch(() => {})
      }

      disconnectedCallback() {
        disconnectedCallback?.call(this)
        this.cssRuntime?.destroy()
        this.cssRuntime = undefined
      }
    }
  }
}
