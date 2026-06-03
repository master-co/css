import type { Plugin } from 'vite'
import fg from 'fast-glob'
import { ENTRY_MODULE_PATTERNS } from '../common'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'

export default function ResolveContextPlugin(options: PluginOptions, context: PluginContext): Plugin {
    return {
        name: 'master-css:resolve-context',
        enforce: 'pre',
        configResolved(config) {
            context.config = config
            context.entryId = fg.sync(ENTRY_MODULE_PATTERNS, { cwd: config.root, absolute: true, onlyFiles: true, caseSensitiveMatch: false })[0]
            if (process.env.DEBUG) {
                console.log(`[@master/css.vite] mode: ${options.mode}`)
                console.log(`[@master/css.vite] entry: ${context.entryId || 'none'}`)
            }
        }
    }
}
