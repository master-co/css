import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { MasterCSSVitePluginContext } from '../core'
import type { DependencyHost } from './failed-stylesheet-dependencies'
import { clearFailedDependencyReconciliation, trackFailedDependencyReconciliation } from './failed-dependency-reconciliation'

interface RecoveryFile { directory: string, file: string, owners: Set<object> }
const recoveries = new WeakMap<MasterCSSVitePluginContext, RecoveryFile>()

/** Allocate during config resolution; retain every started owner. */
export function prepareBuildStylesheetRecovery(context: MasterCSSVitePluginContext, cacheDir: string, environment?: object) {
  const existing = recoveries.get(context)
  if (existing) { if (environment) existing.owners.add(environment);return }
  mkdirSync(cacheDir, { recursive: true })
  const directory = mkdtempSync(join(cacheDir, 'master-css-watch-')), file = join(directory, 'invalidate')
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
