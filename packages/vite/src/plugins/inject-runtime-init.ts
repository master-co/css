import type { Plugin } from 'vite'
import withInjectionTransform from '../factories/with-injection-transform'
import { PluginOptions, PluginContext } from '../core'

const __MASTER_CSS_RUNTIME_INIT_INJECTED__ = '/*__MASTER_CSS_RUNTIME_INIT_INJECTED__*/'

export default function InjectCSSRuntimeInitPlugin(
    options: PluginOptions,
    context: PluginContext
): Plugin {
    return {
        name: 'master-css:inject-runtime-init',
        enforce: 'pre',
        transform(code, id) {
            return withInjectionTransform(code, id, context, __MASTER_CSS_RUNTIME_INIT_INJECTED__, () => {
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
