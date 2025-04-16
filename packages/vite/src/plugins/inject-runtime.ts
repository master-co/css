import type { Plugin } from 'vite'
import withInjectionTransform from '../factories/with-injection-transform'
import { PluginOptions, PluginContext } from '../core'

const __MASTER_CSS_RUNTIME_INJECTED__ = '/*__MASTER_CSS_RUNTIME_INJECTED__*/'

export default function InjectRuntimePlugin(
    options: PluginOptions,
    context: PluginContext
): Plugin {
    return {
        name: 'master-css:inject-runtime',
        enforce: 'pre',
        load(id) {
            return withInjectionTransform(id, context, __MASTER_CSS_RUNTIME_INJECTED__, () => {
                const imports = [
                    `import { initCSSRuntime } from '@master/css-runtime'`,
                    `import config from 'virtual:master-css-config'`,
                    `initCSSRuntime(config)`
                ]
                return imports
            })
        }
    }
}
