import type { Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import { createMasterCSSManifestVirtualModulePlugin } from '@master/css-internal/manifest-virtual-module'
import { loadMasterCSSVirtualManifest } from '@master/css-internal/manifest-loader'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'

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
  return createMasterCSSManifestVirtualModulePlugin(
    (options) => loadMasterCSSVirtualManifest({
      ...options,
      host: manifestHost
    }),
    context
  ) as Plugin
}
