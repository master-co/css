import type { Plugin } from 'vite'
import withInjectionTransform from '../factories/with-injection-transform'
import type { PluginContext, PluginOptions } from '../core'

const __MASTER_CSS_VIRTUAL_MODULE_INJECTED__ = '/*__MASTER_CSS_VIRTUAL_MODULE_INJECTED__*/'

export default function InjectVirtualModulePlugin(
    options: PluginOptions,
    context: PluginContext,
): Plugin {
    return {
        name: 'master-css:inject-virtual-module',
        enforce: 'pre',
        transform(code, id) {
            return withInjectionTransform(code, id, context, __MASTER_CSS_VIRTUAL_MODULE_INJECTED__, () => {
                return [
                    `import '${context.extractor?.options.module}'`
                ]
            })
        }
    }
}
