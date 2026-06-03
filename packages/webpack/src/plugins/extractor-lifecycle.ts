import type { Options } from '@master/css-extractor'
import log from '@techor/log'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { hasModifiedFile } from '../utils/path'

export default function ExtractorLifecyclePlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            if (context.getPluginInitialized()) return

            context.on('init', (options: Options) => {
                options.include = []
            })
            context.on('change', () => {
                context.writeGeneratedCSSModule().catch((error: unknown) => {
                    console.error('[master-css.webpack] generated CSS module update failed:', error)
                })
            })
            context.on('configChange', () => {
                context.writeDefaultConfigModule().catch((error: unknown) => {
                    console.error('[master-css.webpack] config module update failed:', error)
                })
            })
            context.on('reset', () => {
                context.writeDefaultConfigModule().catch((error: unknown) => {
                    console.error('[master-css.webpack] config module update failed:', error)
                })
                void context.queueResetReplay()
            })
            void context.init()

            compiler.hooks.beforeRun.tapPromise(context.name, async () => {
                await context.init()
                await context.prepare()
                await context.writeGeneratedCSSModule()
                log``
            })

            compiler.hooks.watchRun.tapPromise(context.name, async (watchingCompiler) => {
                await context.init()
                const modifiedFiles = (watchingCompiler as Compiler & { modifiedFiles?: ReadonlySet<string> }).modifiedFiles
                const defaultConfigDependencies = context.getDefaultConfigDependencyPaths()
                if (defaultConfigDependencies.some((dependency) => hasModifiedFile(modifiedFiles, dependency))) {
                    await context.reset(context.getOptions())
                    await context.waitForResetReplay()
                }
                await context.startWatch()
            })

            context.setPluginInitialized(true)
        }
    }
}
