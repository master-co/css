import { existsSync } from 'node:fs'
import { dirname, isAbsolute } from 'node:path'
import type { ViteDevServer } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import { clearFailedDependencyReconciliation, failedDependencyVersion, forgetFailedDependencyReconciliation, trackFailedDependencyReconciliation } from './failed-dependency-reconciliation'
import type { FailedDependencyRecovery } from './failed-dependency-reconciliation'
import { trackBuildStylesheetRecovery } from './build-watch-recovery'

export interface DependencyHost {
  environment?: object
  addWatchFile?(file: string): void
}
const watchers = new WeakMap<MasterCSSVitePluginContext, ViteDevServer['watcher']>()
export function configureStylesheetRecovery(context: MasterCSSVitePluginContext, watcher: ViteDevServer['watcher']) {
  failures.delete(context)
  watchers.set(context, watcher)
}
function watchDependency(context: MasterCSSVitePluginContext, file: string) {
  if (!isAbsolute(file)) return
  // A missing leaf may have missing parents too. Register the nearest existing
  // ancestor so both Node and FSEvents backends can discover the new subtree.
  let watchedPath = file
  while (!existsSync(watchedPath)) {
    const parent = dirname(watchedPath)
    if (parent === watchedPath) break
    watchedPath = parent
  }
  watchers.get(context)?.add(watchedPath)
}
const failures = new WeakMap<MasterCSSVitePluginContext, WeakMap<object, Map<string, { id: string, dependencies: Set<string>, failed: boolean }>>>()
function forEnvironment(context: MasterCSSVitePluginContext, environment: object) {
  let environments = failures.get(context)
  if (!environments) { environments = new WeakMap(); failures.set(context, environments) }
  let modules = environments.get(environment)
  if (!modules) { modules = new Map(); environments.set(environment, modules) }
  return modules
}

/** Keep current host dependencies without retaining Vite CSS file-only graph edges. */
export async function withStylesheetDependencies<T>(context: MasterCSSVitePluginContext, host: DependencyHost, id: string, operation: (onDependency: (file: string) => void) => Promise<T>, scope = 'local', recover?: FailedDependencyRecovery): Promise<T> {
  const key = `${scope}:${id}`
  const dependencies = new Set<string>()
  const modules = host.environment && context.config?.command === 'serve' ? forEnvironment(context, host.environment) : undefined
  const versions = new Map<string, string>()
  const buildRecovery = context.config?.command === 'build' && Boolean(context.config.build?.watch)
  const environment = host.environment ?? context
  if (modules || buildRecovery) forgetFailedDependencyReconciliation(context, environment, key)
  try {
    const result = await operation(file => {
      if (file.includes('\0')) return
      if ((modules || buildRecovery) && !dependencies.has(file)) {
        const version = failedDependencyVersion(context, file)
        if (version !== undefined) versions.set(file, version)
      }
      dependencies.add(file)
      if (modules && watchers.has(context)) {
        watchDependency(context, file)
      } else host.addWatchFile?.(file)
    })
    if (modules && dependencies.size) modules.set(key, { id, dependencies, failed: false })
    else modules?.delete(key)
    return result
  } catch (error) {
    if (modules && dependencies.size) {
      modules.set(key, { id, dependencies, failed: true })
      trackFailedDependencyReconciliation(context, host.environment!, key, id, versions, recover)
      // Register absent external ancestors with the existing server watcher.
      for (const file of dependencies) watchDependency(context, file)
    }
    if (buildRecovery) trackBuildStylesheetRecovery(context, host, key, id, versions)
    throw error
  }
}

export function stylesheetDependencyOwners(context: MasterCSSVitePluginContext, environment: object, file: string) {
  const owners = new Map<string, { id: string, failed: boolean }>()
  for (const entry of failures.get(context)?.get(environment)?.values() ?? []) {
    if (entry.dependencies.has(file)) owners.set(entry.id, { id: entry.id, failed: entry.failed || Boolean(owners.get(entry.id)?.failed) })
  }
  return [...owners.values()]
}

export function clearFailedStylesheets(context: MasterCSSVitePluginContext, environment?: object) {
  clearFailedDependencyReconciliation(context, environment)
  if (environment) failures.get(context)?.delete(environment)
  else failures.delete(context)
}
