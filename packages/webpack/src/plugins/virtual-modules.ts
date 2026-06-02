import { EMPTY_CONFIG_MODULE } from '@master/css-configer/module'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

export function VirtualModuleRegistryPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            context.virtualModule = new VirtualModulesPlugin({
                [context.virtualCSSImportModuleId]: '',
                [context.virtualConfigModuleId]: EMPTY_CONFIG_MODULE
            })

            context.virtualModule.apply(compiler)
        }
    }
}
