import { EMPTY_MANIFEST_JSON } from '@master/css-integration/manifest-module'
import { toInlineManifestModule } from '@master/css-integration/manifest-facade'
import { EMPTY_EMITTED_GLOBALS_MODULE } from '@master/css-integration/emitted-globals-module'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

export default function VirtualModuleRegistryPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            context.virtualModule = new VirtualModulesPlugin({
                [context.virtualCSSImportModuleId]: '',
                [context.virtualManifestModuleId]: toInlineManifestModule(EMPTY_MANIFEST_JSON),
                [context.virtualEmittedGlobalsModuleId]: EMPTY_EMITTED_GLOBALS_MODULE
            })

            context.virtualModule.apply(compiler)
        }
    }
}
