import type { ScannerOptions } from '@master/css-scanner'
import log from '@techor/log'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { hasModifiedFile } from '../utils/path'

export default function ScannerLifecyclePlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            if (context.getPluginInitialized()) return

            context.on('init', (options: ScannerOptions) => {
                options.include = []
            })
            context.on('change', () => {
                context.writeGeneratedCSSModule().catch((error: unknown) => {
                    console.error('[master-css.webpack] generated CSS module update failed:', error)
                })
            })
            context.on('resetDependencyChange', () => {
                context.writeDefaultManifestModule().catch((error: unknown) => {
                    console.error('[master-css.webpack] manifest module update failed:', error)
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
                await context.prepare()
                await context.writeGeneratedCSSModule()
                log``
            })

            compiler.hooks.watchRun.tapPromise(context.name, async (watchingCompiler) => {
                await context.init()
                const modifiedFiles = (watchingCompiler as Compiler & { modifiedFiles?: ReadonlySet<string> }).modifiedFiles
                const defaultManifestDependencies = context.getDefaultManifestDependencyPaths()
                if (defaultManifestDependencies.some((dependency) => hasModifiedFile(modifiedFiles, dependency))) {
                    await context.reset(context.getOptions())
                    await context.waitForResetReplay()
                }
                await context.startWatch()
            })

            context.setPluginInitialized(true)
        }
    }
}
