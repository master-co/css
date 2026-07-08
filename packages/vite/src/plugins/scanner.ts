import CSSScanner from '@master/css-scanner'
import type { Plugin } from 'vite'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'

export default function ScannerPlugin(options: PluginOptions, context: PluginContext): Plugin {
  return {
    name: 'master-css:scanner',
    enforce: 'pre',
    async configResolved(config) {
      const scanner = new CSSScanner(options.scanner, config.root)
      context.scanner = scanner
      await scanner.init()
      scanner.options.verbose = 0
    },
  }
}
