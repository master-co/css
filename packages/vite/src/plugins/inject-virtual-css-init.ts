import type { Plugin } from 'vite'
import withInjectionTransform from '../factories/with-injection-transform'
import type { PluginContext, PluginOptions } from '../core'

const __MASTER_CSS_VIRTUAL_CSS_IMPORT_INJECTED__ = '/*__MASTER_CSS_VIRTUAL_CSS_IMPORT_INJECTED__*/'

export default function InjectVirtualCSSImportPlugin(
    options: PluginOptions,
    context: PluginContext,
): Plugin {
    return {
        name: 'master-css:inject-virtual-css-import',
        enforce: 'pre',
        load(id) {
            return withInjectionTransform(id, context, __MASTER_CSS_VIRTUAL_CSS_IMPORT_INJECTED__, () => {
                return [
                    `import '${context.builder?.options.module}'`
                ]
            })
        }
    }
}
