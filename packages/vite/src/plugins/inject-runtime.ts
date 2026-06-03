import type { Plugin } from 'vite'
import { CSS_RUNTIME_INJECTION } from '../common'
import { PluginOptions } from '../options'

const __MASTER_CSS_RUNTIME_INJECTED__ = '/*__MASTER_CSS_RUNTIME_INJECTED__*/'

export default function InjectRuntimePlugin(
    _options: PluginOptions
): Plugin {
    return {
        name: 'master-css:inject-runtime',
        enforce: 'pre',
        transformIndexHtml(html) {
            if (html.includes(__MASTER_CSS_RUNTIME_INJECTED__) || html.includes(CSS_RUNTIME_INJECTION)) {
                return
            }
            return {
                html,
                tags: [
                    {
                        tag: 'script',
                        attrs: {
                            type: 'module'
                        },
                        children: [
                            __MASTER_CSS_RUNTIME_INJECTED__,
                            CSS_RUNTIME_INJECTION
                        ].join('\n'),
                        injectTo: 'head-prepend'
                    }
                ]
            }
        }
    }
}
