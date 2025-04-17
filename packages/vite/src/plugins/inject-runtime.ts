import type { Plugin } from 'vite'
import withInjectionTransform from '../factories/with-injection-transform'
import { PluginOptions, PluginContext } from '../core'
import { CSS_RUNTIME_INJECTIOIN } from '../common'

const __MASTER_CSS_RUNTIME_INJECTED__ = '/*__MASTER_CSS_RUNTIME_INJECTED__*/'

export default function InjectRuntimePlugin(
    options: PluginOptions,
    context: PluginContext
): Plugin {
    return {
        name: 'master-css:inject-runtime',
        enforce: 'pre',
        transform(code, id) {
            return withInjectionTransform(code, id, context, __MASTER_CSS_RUNTIME_INJECTED__, () => CSS_RUNTIME_INJECTIOIN)
        }
    }
}
