import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { defaultBuildManifest } from '@master/css-build-internal/project'
import type { Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function ScannerPlugin(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  return {
    name: 'master-css:scanner',
    enforce: 'pre',
    async configResolved(config) {
      const scanner = new MasterCSSScanner({
        manifest: defaultBuildManifest,
        ...options.scanner
      }, config.root)
      context.scanner = scanner
      await scanner.init()
      scanner.options.verbose = 0
    },
    async closeBundle() {
      await context.scanner?.dispose()
      context.scanner = undefined
    }
  }
}
