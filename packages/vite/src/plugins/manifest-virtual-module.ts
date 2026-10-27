import { normalizePath, type Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import { createMasterCSSManifestVirtualModulePlugin } from '@master/css-internal/manifest-virtual-module'
import { loadMasterCSSVirtualManifest } from '@master/css-internal/manifest-loader'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'
import { compileRuntimeProgram } from '@master/css/node'
import { RESOLVED_VIRTUAL_MANIFEST_ID, RESOLVED_VIRTUAL_PROGRAM_ID } from '../common'
import { createManifestRecovery } from '../utils/manifest-recovery'
import type { DependencyHost } from '../utils/failed-stylesheet-dependencies'

const manifestHost = {
  discoverManifestEntries,
  loadProjectManifest,
  collectStylesheetDependencies(entry: string, options: { root?: string }) {
    return collectStylesheetDependenciesSync(entry, undefined, {
      projectDir: options.root
    })
  }
}

export default function ManifestVirtualModulePlugin(
  context: MasterCSSVitePluginContext
): Plugin {
  const plugin = createMasterCSSManifestVirtualModulePlugin(
    async (options) => {
      const result = await loadMasterCSSVirtualManifest({
        ...options,
        onDependency: file => options.onDependency(normalizePath(file)),
        host: manifestHost
      })
      return { ...result, dependencies: result.dependencies.map(normalizePath) }
    },
    context,
    manifest => compileRuntimeProgram(manifest)
  )
  type Host = DependencyHost & ThisParameterType<typeof plugin.load>
  const createRecovery = (id: string) => createManifestRecovery(context, id,
    (onDependency, host: Host) => plugin.load.call({ environment: host.environment, addWatchFile: onDependency, emitFile: host.emitFile?.bind(host) }, id))
  const recovery = createRecovery(RESOLVED_VIRTUAL_MANIFEST_ID)
  // Browsers import the program, compiled from the same manifest.
  const programRecovery = createRecovery(RESOLVED_VIRTUAL_PROGRAM_ID)
  return {
    ...plugin,
    async buildStart() {
      // A watch rebuild must refresh a failed manifest before HTML checks it.
      // Otherwise assertReady() rethrows the previous build's error before load runs.
      if (programRecovery.failed) {
        try { await programRecovery.run(this) } catch { /* The program request reports the failure. */ }
      }
      if (context.config?.command === 'build' && !recovery.failed) return
      // Retain the diagnostic and dependency set while allowing Vite to listen.
      try { await recovery.run(this) } catch { /* HTML and module requests report the original failure. */ }
    },
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MANIFEST_ID) return recovery.run(this)
      if (id === RESOLVED_VIRTUAL_PROGRAM_ID) return programRecovery.run(this)
    },
    transformIndexHtml: {
      order: 'pre',
      handler() {
        recovery.assertReady()
        programRecovery.assertReady()
      }
    },
    closeBundle() {
      if (context.config?.build?.watch || !this.environment) return
      recovery.close(this.environment)
      programRecovery.close(this.environment)
    },
    closeWatcher() {
      if (!this.environment) return
      recovery.close(this.environment)
      programRecovery.close(this.environment)
    }
  } as Plugin
}
