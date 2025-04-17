import { Plugin } from 'vite'
import { PluginContext, PluginOptions } from '../core'
import ensureCSSConfigPath from 'shared/utils/ensure-css-config-path'
import { RESOLVED_VIRTUAL_CONFIG_ID, VIRTUAL_CONFIG_ID } from '../common'

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
            if (id === VIRTUAL_CONFIG_ID) return RESOLVED_VIRTUAL_CONFIG_ID
        },
        load(id) {
            if (id === RESOLVED_VIRTUAL_CONFIG_ID) {
                if (context.configPath) {
                    return `import config from ${JSON.stringify(context.configPath)}; export default config;`
                } else {
                    return `export default {}`
                }
            }
        }
    }
}