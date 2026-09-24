import type { Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import { createMasterCSSManifestVirtualModulePlugin } from '@master/css-internal/manifest-virtual-module'
import { loadMasterCSSVirtualManifest } from '@master/css-internal/manifest-loader'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'
import { RESOLVED_VIRTUAL_MANIFEST_ID } from '../common'
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
    (options) => loadMasterCSSVirtualManifest({
      ...options,
      host: manifestHost
    }),
    context
  )
  type Host = DependencyHost & ThisParameterType<typeof plugin.load>
  const recovery = createManifestRecovery(context, RESOLVED_VIRTUAL_MANIFEST_ID,
    (onDependency, host: Host) => plugin.load.call({ addWatchFile: onDependency, emitFile: host.emitFile?.bind(host) }, RESOLVED_VIRTUAL_MANIFEST_ID))
  return {
    ...plugin,
    async buildStart() {
      // A watch rebuild must refresh a failed manifest before HTML checks it.
      // Otherwise assertReady() rethrows the previous build's error before load runs.
      if (context.config?.command === 'build' && !recovery.failed) return
      // Retain the diagnostic and dependency set while allowing Vite to listen.
      try { await recovery.run(this) } catch { /* HTML and module requests report the original failure. */ }
    },
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MANIFEST_ID) return recovery.run(this)
    },
    transformIndexHtml: {
      order: 'pre',
      handler() { recovery.assertReady() }
    },
    closeBundle() { if (!context.config?.build?.watch && this.environment) recovery.close(this.environment) },
    closeWatcher() { if (this.environment) recovery.close(this.environment) }
  } as Plugin
}
