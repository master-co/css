import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { defaultBuildManifest } from '@master/css-internal/project'
import type { Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function ScannerPlugin(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  let scannerInitialization: Promise<MasterCSSScanner> | undefined
  const ensureScanner = async () => {
    if (context.scanner) return context.scanner
    if (scannerInitialization) return scannerInitialization
    const config = context.config
    if (!config) {
      throw new Error('[@master/css-vite] Cannot initialize the scanner before Vite config is resolved.')
    }
    const scanner = new MasterCSSScanner({
      manifest: defaultBuildManifest,
      ...options.scanner
    }, config.root)
    scannerInitialization = scanner.init()
      .then(() => {
        scanner.options.verbose = 0
        context.scanner = scanner
        return scanner
      })
      .catch(async (error) => {
        await scanner.dispose()
        throw error
      })
      .finally(() => {
        scannerInitialization = undefined
      })
    return scannerInitialization
  }
  return {
    name: 'master-css:scanner',
    enforce: 'pre',
    async configResolved(config) {
      context.config = config
      await ensureScanner()
    },
    async buildStart() {
      await ensureScanner()
    },
    async closeBundle() {
      const scanner = context.scanner
      context.scanner = undefined
      await scanner?.dispose()
      context.stylesheets?.dispose()
      context.stylesheets = undefined
    }
  }
}
