import type { Plugin } from 'vite'
import { CSS_RUNTIME_INJECTION } from '../common'
import { MASTER_CSS_RUNTIME_INJECTED_MARKER } from '@master/css-integration/runtime'
import { PluginOptions } from '../options'

export default function InjectRuntimePlugin(
    _options: PluginOptions
): Plugin {
    return {
        name: 'master-css:inject-runtime',
        enforce: 'pre',
        transformIndexHtml(html) {
            if (html.includes(MASTER_CSS_RUNTIME_INJECTED_MARKER) || html.includes(CSS_RUNTIME_INJECTION)) {
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
                            MASTER_CSS_RUNTIME_INJECTED_MARKER,
                            CSS_RUNTIME_INJECTION
                        ].join('\n'),
                        injectTo: 'head-prepend'
                    }
                ]
            }
        }
    }
}
