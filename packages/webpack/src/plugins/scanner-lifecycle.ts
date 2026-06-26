import { createConsola } from 'consola'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { hasModifiedFile } from '../utils/path'

const logger = createConsola({ level: 3 })

export default function ScannerLifecyclePlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            if (context.getPluginInitialized()) return

            context.on('change', () => {
                context.writeGeneratedCSSModule().catch((error: unknown) => {
                    console.error('[master-css.webpack] generated CSS module update failed:', error)
                })
            })
            context.on('reset', () => {
                context.writeDefaultManifestModule().catch((error: unknown) => {
                    console.error('[master-css.webpack] manifest module update failed:', error)
                })
                void context.queueResetReplay()
            })
            void context.init()

            compiler.hooks.beforeRun.tapPromise(context.name, async () => {
                await context.init()
                await context.writeGeneratedCSSModule()
                logger.log('')
            })

            compiler.hooks.watchRun.tapPromise(context.name, async (watchingCompiler) => {
                await context.init()
                const modifiedFiles = (watchingCompiler as Compiler & { modifiedFiles?: ReadonlySet<string> }).modifiedFiles
                const resetDependencies = context.getResetDependencyPaths()
                if (resetDependencies.some((dependency) => hasModifiedFile(modifiedFiles, dependency))) {
                    await context.reset(context.getOptions())
                    await context.waitForResetReplay()
                }
            })

            context.setPluginInitialized(true)
        }
    }
}
