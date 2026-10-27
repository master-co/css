import { ensureScanner, disposeScanner, trackScannerEnvironments, releaseScannerEnvironment } from '../utils/scanner-context'
import type { Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function ScannerPlugin(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  return {
    name: 'master-css:scanner',
    enforce: 'pre',
    async configResolved(config) {
      context.config = config
      await ensureScanner(options, context)
    },
    async buildStart() {
      await ensureScanner(options, context)
    },
    configureServer(server) {
      const config = server.config
      trackScannerEnvironments(context, config, () => server.config === config ? Object.values(server.environments) : [])
    },
    async closeBundle() {
      const config = this.environment?.getTopLevelConfig() ?? context.config
      if (releaseScannerEnvironment(context, config, this.environment)) await disposeScanner(context, config)
    }
  }
}
