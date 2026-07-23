import { registerStylesheetSource as registerStylesheetCSSSource } from '@master/css-compiler/stylesheet'
import type { MasterCSSVitePluginContext } from '../core'
import { getScanner } from './scanner-context'

export async function registerStylesheetSource(context: MasterCSSVitePluginContext, id: string, source: string) {
  context.stylesheetSources ??= new Map()
  const scanner = getScanner(context)
  return registerStylesheetCSSSource(scanner, context.stylesheetSources, id, source, {
    baseManifest: scanner.css.manifest,
    projectDir: context.config?.root
  })
}
