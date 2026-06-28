import type { Plugin } from 'vite'
import {
    DEV_RUNTIME_ENTRY_ID,
    RUNTIME_ENTRY_ID
} from '../common'
import { PluginOptions } from '../options'

export default function InjectRuntimePlugin(
    _options: PluginOptions
): Plugin {
    return {
        name: 'master-css:inject-runtime',
        enforce: 'pre',
        transformIndexHtml: {
            order: 'pre',
            handler(html, { server }) {
                if (
                    html.includes(RUNTIME_ENTRY_ID)
                    || html.includes(DEV_RUNTIME_ENTRY_ID)
                ) {
                    return
                }
                return {
                    html,
                    tags: [
                        {
                            tag: 'script',
                            attrs: {
                                type: 'module',
                                src: server ? DEV_RUNTIME_ENTRY_ID : RUNTIME_ENTRY_ID
                            },
                            injectTo: 'head-prepend'
                        }
                    ]
                }
            }
        }
    }
}
