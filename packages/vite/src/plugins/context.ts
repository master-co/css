import type { Plugin } from 'vite'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'

export default function ContextPlugin(options: PluginOptions, context: PluginContext): Plugin {
    return {
        name: 'master-css:context',
        enforce: 'pre',
        configResolved(config) {
            context.config = config
            if (process.env.DEBUG) {
                console.log(`[@master/css.vite] mode: ${options.mode}`)
            }
        }
    }
}
