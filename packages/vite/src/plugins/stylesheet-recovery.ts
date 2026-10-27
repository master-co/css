import { invalidatePreparedSassSources } from '../utils/build-sass-source'
import type { DevEnvironment, Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import { clearFailedStylesheets, stylesheetDependencyOwners, configureStylesheetRecovery } from '../utils/failed-stylesheet-dependencies'
import { configureFailedDependencyReconciliation } from '../utils/failed-dependency-reconciliation'
import { sendRecoveryError } from '../utils/recovery-error'

/** Restore failed dependency edges before Sass invalidation and normal HMR propagation. */
export default function StylesheetRecoveryPlugin(context: MasterCSSVitePluginContext): Plugin {
  const closed = new WeakSet<object>()
  const recovering = new WeakMap<object, Map<string, Promise<void>>>()
  const recover = (environment: DevEnvironment, id: string, files: string[], active: () => boolean = () => true, reportError = false): Promise<void> => {
    if (closed.has(environment) || !active()) return Promise.resolve()
    let pending = recovering.get(environment)
    if (!pending) { pending = new Map();recovering.set(environment, pending) }
    const prior = pending.get(id)
    if (prior) return prior
    const operation = (async () => {
      const module = environment.moduleGraph.getModuleById(id)
      if (!module) return
      for (const file of files) invalidatePreparedSassSources(context, file)
      const initialFailure = module.isSelfAccepting === undefined
      environment.moduleGraph.invalidateModule(module)
      try { await environment.transformRequest(module.url) } catch (error) {
        if (reportError && active() && !closed.has(environment)) {
          sendRecoveryError(environment, error, id)
        }
        throw error
      }
      if (closed.has(environment) || !active()) return
      if (initialFailure && environment.config.consumer === 'client') environment.hot.send({ type: 'full-reload', path: '*' })
      else await environment.reloadModule(module)
    })().finally(() => pending.delete(id))
    pending.set(id, operation)
    return operation
  }
  return {
    name: 'master-css:stylesheet-recovery',
    apply: 'serve',
    enforce: 'pre',
    configureServer(server) {
      configureStylesheetRecovery(context, server.watcher)
      configureFailedDependencyReconciliation(context, server, (environment, id, files, active) => recover(environment as DevEnvironment, id, files, active, true))
    },
    async hotUpdate({ file, modules }) {
      const owners = stylesheetDependencyOwners(context, this.environment, file)
      if (!owners.length) return
      invalidatePreparedSassSources(context, file)
      const affected = new Set(modules)
      for (const { id, failed } of owners) {
        const module = this.environment.moduleGraph.getModuleById(id)
        if (!module) continue
        this.environment.moduleGraph.invalidateModule(module)
        if (failed && module.isSelfAccepting === undefined) await recover(this.environment, id, [file])
        affected.add(module)
      }
      return [...affected]
    },
    closeBundle() {
      closed.add(this.environment)
      recovering.delete(this.environment)
      clearFailedStylesheets(context, this.environment)
    }
  }
}
