import type { Plugin } from 'vite'
import withInjectionTransform from '../factories/with-injection-transform'
import type { PluginContext, PluginOptions } from '../core'

const __MASTER_CSS_NORMAL_CSS_INJECTED__ = '/*__MASTER_CSS_NORMAL_CSS_INJECTED__*/'

export default function InjectNormalCSSPlugin(
    options: PluginOptions,
    context: PluginContext,
): Plugin {
    return {
        name: 'master-css:inject-normal-css',
        enforce: 'pre',
        transform(code, id) {
            return withInjectionTransform(code, id, context, __MASTER_CSS_NORMAL_CSS_INJECTED__, () => `import '@master/normal.css'`)
        }
    }
}
