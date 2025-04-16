import { Plugin } from 'vite'
import { PluginContext, PluginOptions } from '../core'
import ensureCSSConfigPath from 'shared/utils/ensure-css-config-path'
import { resolvedVirtualConfigId, virtualConfigId } from '../common'

export function ConfigVirtualModulePlugin(
    options: PluginOptions,
    context: PluginContext
): Plugin {
    return {
        name: 'master-css:virtual-module:config',
        enforce: 'pre',
        configResolved(config) {
            context.configPath = ensureCSSConfigPath(options.config, config.root)
            if (process.env.DEBUG) {
                console.log(`[@master/css.vite] config: ${context.configPath || 'none'}`)
            }
        },
        buildStart() {
            if (context.configPath) this.addWatchFile(context.configPath)
        },
        resolveId(id) {
            if (id === virtualConfigId) return resolvedVirtualConfigId
        },
        load(id) {
            if (id === resolvedVirtualConfigId) {
                if (context.configPath) {
                    return `import config from ${JSON.stringify(context.configPath)}; export default config;`
                } else {
                    return `export default {}`
                }
            }
        }
    }
}