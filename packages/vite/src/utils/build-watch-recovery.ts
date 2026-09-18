import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createFilter, type ResolvedConfig } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import type { DependencyHost } from './failed-stylesheet-dependencies'
import { clearFailedDependencyReconciliation, trackFailedDependencyReconciliation } from './failed-dependency-reconciliation'

interface RecoveryFile { directory: string, file: string, owners: Set<object> }
const recoveries = new WeakMap<MasterCSSVitePluginContext, RecoveryFile>()
type BuildWatch = ResolvedConfig['build']['watch']

/**
 * The build host applies `build.watch` include and exclude to every watched
 * file, plugin-added ones included, so a project filter can silently drop the
 * file recovery depends on. Take the first location the project's own filter
 * accepts rather than overriding what it asked for.
 */
function resolveRecoveryLocation(root: string, cacheDir: string, watch: BuildWatch) {
  const accepts = createFilter(watch?.include, watch?.exclude, { resolve: false })
  // The build host only watches inside the project, so every candidate stays
  // there: the cache directory by default, then a suffix for extension
  // includes, then the project root for filters that exclude the cache.
  const candidates = [
    { base: cacheDir, prefix: 'master-css-watch-', name: 'invalidate' },
    { base: cacheDir, prefix: 'master-css-watch-', name: 'invalidate.css' },
    { base: root, prefix: '.master-css-watch-', name: 'invalidate.css' }
  ]
  return candidates.find(({ base, prefix, name }) => accepts(join(base, `${prefix}probe`, name)))
}

/** Allocate during config resolution; retain every started owner. */
export function prepareBuildStylesheetRecovery(context: MasterCSSVitePluginContext, root: string, cacheDir: string, watch: BuildWatch, environment?: object) {
  const existing = recoveries.get(context)
  if (existing) { if (environment) existing.owners.add(environment);return }
  const location = resolveRecoveryLocation(root, cacheDir, watch)
  // Every candidate is filtered out, so a watched file cannot carry the signal.
  // Failed stylesheets still report their diagnostics; they just wait for a
  // change the project does watch.
  if (!location) return
  mkdirSync(location.base, { recursive: true })
  const directory = mkdtempSync(join(location.base, location.prefix)), file = join(directory, location.name)
  writeFileSync(file, 'pending')
  recoveries.set(context, { directory, file, owners: new Set(environment ? [environment] : []) })
}

/** An existing owned cache file lets the build host invalidate failed modules. */
export function trackBuildStylesheetRecovery(context: MasterCSSVitePluginContext, host: DependencyHost, key: string, id: string, versions: Map<string, string>) {
  const state = recoveries.get(context)
  if (!versions.size || !host.addWatchFile || !state) return
  const environment = host.environment ?? context
  state.owners.add(environment)
  host.addWatchFile(state.file)
  trackFailedDependencyReconciliation(context, environment, key, id, versions, async (_environment, _id, _changed, active) => {
    if (active()) writeFileSync(state.file, String(process.hrtime.bigint()))
  })
}

export function closeBuildStylesheetRecovery(context: MasterCSSVitePluginContext, environment: object) {
  clearFailedDependencyReconciliation(context, environment)
  const state = recoveries.get(context)
  if (!state) return
  state.owners.delete(environment)
  if (!state.owners.size) {
    rmSync(state.directory, { recursive: true, force: true })
    recoveries.delete(context)
  }
}
