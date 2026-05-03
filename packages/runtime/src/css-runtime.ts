import type { Config } from '@master/css'
import CSSRuntime from './core'
import initCSSRuntime from './init'

type CSSRuntimeHostConstructor = new (...args: any[]) => HTMLElement
type CSSRuntimeConfig = Config | ((host: HTMLElement) => Config | undefined)
type CSSRuntimeRoot = ShadowRoot | ((host: HTMLElement) => ShadowRoot | null | undefined)

export interface CSSRuntimeDecoratorOptions {
    config?: CSSRuntimeConfig
    root?: CSSRuntimeRoot
    autoObserve?: boolean
}

function isOptions(value: CSSRuntimeConfig | CSSRuntimeDecoratorOptions | undefined): value is CSSRuntimeDecoratorOptions {
    return !!value && (
        'config' in value ||
        'root' in value ||
        'autoObserve' in value
    )
}

function resolveConfig(host: HTMLElement, config: CSSRuntimeConfig | undefined): Config | undefined {
    return typeof config === 'function' ? config(host) : config
}

function resolveRoot(host: HTMLElement, root: CSSRuntimeRoot | undefined): ShadowRoot | null | undefined {
    return typeof root === 'function'
        ? root(host)
        : root || host.shadowRoot
}

export default function cssRuntime(config?: CSSRuntimeConfig): <T extends CSSRuntimeHostConstructor>(target: T) => T
export default function cssRuntime(options?: CSSRuntimeDecoratorOptions): <T extends CSSRuntimeHostConstructor>(target: T) => T
export default function cssRuntime(config?: CSSRuntimeConfig, options?: Omit<CSSRuntimeDecoratorOptions, 'config'>): <T extends CSSRuntimeHostConstructor>(target: T) => T
export default function cssRuntime(
    configOrOptions?: CSSRuntimeConfig | CSSRuntimeDecoratorOptions,
    options?: Omit<CSSRuntimeDecoratorOptions, 'config'>
) {
    const resolvedOptions = isOptions(configOrOptions)
        ? configOrOptions
        : { ...options, config: configOrOptions }

    return function <T extends CSSRuntimeHostConstructor>(target: T): T {
        const connectedCallback = target.prototype.connectedCallback as (() => void) | undefined
        const disconnectedCallback = target.prototype.disconnectedCallback as (() => void) | undefined

        return class extends target {
            cssRuntime?: CSSRuntime

            connectedCallback() {
                connectedCallback?.call(this)
                const root = resolveRoot(this, resolvedOptions.root)
                if (!root) {
                    throw new Error('`@cssRuntime()` requires a shadow root. Provide `options.root` or create a shadow root before `connectedCallback()` finishes.')
                }
                this.cssRuntime = initCSSRuntime(
                    resolveConfig(this, resolvedOptions.config),
                    root,
                    resolvedOptions.autoObserve
                )
            }

            disconnectedCallback() {
                disconnectedCallback?.call(this)
                this.cssRuntime?.destroy()
                this.cssRuntime = undefined
            }
        }
    }
}
