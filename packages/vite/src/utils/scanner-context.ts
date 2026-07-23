import type { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import type { MasterCSSVitePluginContext } from '../core'

export function getScanner(context: MasterCSSVitePluginContext): MasterCSSScanner {
  if (!context.scanner) {
    throw new Error('[@master/css-vite] Scanner context was not initialized.')
  }
  return context.scanner
}
