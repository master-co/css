import type { Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import { configureBuildDependencyReconciliation, acknowledgeFailedDependencyChange } from '../utils/failed-dependency-reconciliation'
import { closeBuildStylesheetRecovery, prepareBuildStylesheetRecovery } from '../utils/build-watch-recovery'

/** Recover failed watch builds without changing authored files or dependency data. */
export default function BuildStylesheetRecoveryPlugin(context: MasterCSSVitePluginContext): Plugin {
  return {
    name: 'master-css:build-stylesheet-recovery', apply: 'build', enforce: 'pre',
    configResolved(config) {
      if (config.build?.watch) prepareBuildStylesheetRecovery(context, config.root, config.cacheDir, config.build.watch)
    },
    buildStart() {
      if (!context.config?.build?.watch) return
      prepareBuildStylesheetRecovery(context, context.config.root, context.config.cacheDir, context.config.build.watch, this.environment ?? context)
      configureBuildDependencyReconciliation(context, context.config.build.watch)
    },
    watchChange(id) { acknowledgeFailedDependencyChange(context, id) },
    closeWatcher() { closeBuildStylesheetRecovery(context, this.environment ?? context) }
  }
}
