import { createStylesheetCollection } from '@master/css-compiler/stylesheet'
import type { MasterCSSVitePluginContext } from '../core'
import { getScanner } from './scanner-context'

export async function registerStylesheetSource(context: MasterCSSVitePluginContext, id: string, source: string) {
  context.stylesheets ??= createStylesheetCollection()
  const scanner = getScanner(context)
  return context.stylesheets.register(scanner, id, source, {
    baseManifest: scanner.css.manifest,
    projectDir: context.config?.root
  })
}
