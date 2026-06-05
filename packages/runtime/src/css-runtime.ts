import type { Config } from 'shared/css-config'
import type { MasterCSSPreloaded } from 'shared/css-preloaded-module'
import CSSRuntime from './core'
import initCSSRuntime from './init'

type CSSRuntimeHostConstructor = new (...args: any[]) => HTMLElement
type CSSRuntimeConfig = Config | ((host: HTMLElement) => Config | undefined)
type CSSRuntimeRoot = ShadowRoot | ((host: HTMLElement) => ShadowRoot | null | undefined)
type CSSRuntimePreloaded = MasterCSSPreloaded | ((host: HTMLElement) => MasterCSSPreloaded | undefined)

export interface CSSRuntimeOptions {
    config?: CSSRuntimeConfig
    root?: CSSRuntimeRoot
    autoObserve?: boolean
    preloaded?: CSSRuntimePreloaded
}

export type CSSRuntimeDecoratorOptions = CSSRuntimeOptions

function resolveConfig(host: HTMLElement, config: CSSRuntimeConfig | undefined): Config | undefined {
    return typeof config === 'function' ? config(host) : config
}

function resolveRoot(host: HTMLElement, root: CSSRuntimeRoot | undefined): ShadowRoot | null | undefined {
    return typeof root === 'function'
        ? root(host)
        : root || host.shadowRoot
}

function resolvePreloaded(host: HTMLElement, preloaded: CSSRuntimePreloaded | undefined): MasterCSSPreloaded | undefined {
    return typeof preloaded === 'function' ? preloaded(host) : preloaded
}

export default function cssRuntime(options: CSSRuntimeOptions = {}): <T extends CSSRuntimeHostConstructor>(target: T) => T {
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
                    config: resolveConfig(this, options.config),
                    root,
                    autoObserve: options.autoObserve,
                    preloaded: resolvePreloaded(this, options.preloaded)
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
