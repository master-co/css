import { Plugin } from 'vite'
import { PluginContext, PluginOptions } from '../core'
import ensureCSSConfigPath from 'shared/utils/ensure-css-config-path'
import { resolvedVirtualConfigId, virtualConfigId } from '../common'

export function ConfigVirtualModulePlugin(
    options: PluginOptions,
    context: PluginContext
): Plugin {
    let configPath: string | undefined
    return {
        name: 'master-css:virtual-module:config',
        enforce: 'pre',
        configResolved(config) {
            configPath = ensureCSSConfigPath(options.config, config.root)
            if (process.env.DEBUG) {
                console.log(`[@master/css.vite] config: ${configPath || 'none'}`)
            }
        },
        buildStart() {
            if (configPath) this.addWatchFile(configPath)
        },
        resolveId(id) {
            if (id === virtualConfigId) return resolvedVirtualConfigId
        },
        load(id) {
            if (id === resolvedVirtualConfigId) {
                if (configPath) {
                    return `import config from ${JSON.stringify(configPath)}; export default config;`
                } else {
                    return `export default {}`
                }
            }
        }
    }
}