import { EMPTY_PLAN_JSON } from '@master/css-integration/plan-module'
import { toInlinePlanModule } from '@master/css-integration/plan-facade'
import { EMPTY_PRELOADED_MODULE } from '@master/css-integration/preloaded-module'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

export default function VirtualModuleRegistryPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            context.virtualModule = new VirtualModulesPlugin({
                [context.virtualCSSImportModuleId]: '',
                [context.virtualPlanModuleId]: toInlinePlanModule(EMPTY_PLAN_JSON),
                [context.virtualPreloadedModuleId]: EMPTY_PRELOADED_MODULE
            })

            context.virtualModule.apply(compiler)
        }
    }
}
