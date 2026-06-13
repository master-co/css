import type { MasterCSSPlan } from 'shared/master-css-plan'
import type { MasterCSSPreloaded } from '@master/css-engine'
import type { MasterCSSRuntimeManifest } from 'shared/master-css-runtime-manifest'
import CSSRuntime from './core'
import initCSSRuntime from './init'

type CSSRuntimeHostConstructor = new (...args: any[]) => HTMLElement
type CSSRuntimePlan = MasterCSSPlan | ((host: HTMLElement) => MasterCSSPlan)
type CSSRuntimeRoot = ShadowRoot | ((host: HTMLElement) => ShadowRoot | null | undefined)
type CSSRuntimePreloaded = MasterCSSPreloaded | ((host: HTMLElement) => MasterCSSPreloaded | undefined)
type CSSRuntimeManifest = MasterCSSRuntimeManifest | ((host: HTMLElement) => MasterCSSRuntimeManifest | undefined)

export interface CSSRuntimeOptions {
    plan: CSSRuntimePlan
    root?: CSSRuntimeRoot
    autoObserve?: boolean
    preloaded?: CSSRuntimePreloaded
    manifest?: CSSRuntimeManifest
}

export type CSSRuntimeDecoratorOptions = CSSRuntimeOptions

function resolvePlan(host: HTMLElement, plan: CSSRuntimePlan): MasterCSSPlan {
    return typeof plan === 'function' ? plan(host) : plan
}

function resolveRoot(host: HTMLElement, root: CSSRuntimeRoot | undefined): ShadowRoot | null | undefined {
    return typeof root === 'function'
        ? root(host)
        : root || host.shadowRoot
}

function resolvePreloaded(host: HTMLElement, preloaded: CSSRuntimePreloaded | undefined): MasterCSSPreloaded | undefined {
    return typeof preloaded === 'function' ? preloaded(host) : preloaded
}

function resolveManifest(host: HTMLElement, manifest: CSSRuntimeManifest | undefined): MasterCSSRuntimeManifest | undefined {
    return typeof manifest === 'function' ? manifest(host) : manifest
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
                this.cssRuntime = initCSSRuntime({
                    plan: resolvePlan(this, options.plan),
                    root,
                    autoObserve: options.autoObserve,
                    preloaded: resolvePreloaded(this, options.preloaded),
                    manifest: resolveManifest(this, options.manifest)
                })
            }

            disconnectedCallback() {
                disconnectedCallback?.call(this)
                this.cssRuntime?.destroy()
                this.cssRuntime = undefined
            }
        }
    }
}
