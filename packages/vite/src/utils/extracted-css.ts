import type { MasterCSSVitePluginContext } from '../core'
import { getScanner } from './scanner-context'

export async function getExtractedCSSResult(context: MasterCSSVitePluginContext) {
  const scanner = getScanner(context)
  if (!context.stylesheets) {
    const { createStylesheetCollection } = await import('@master/css-compiler/stylesheet')
    context.stylesheets = createStylesheetCollection()
  }
  const result = await context.stylesheets.compose({
    scanner,
    baseManifest: scanner.css.manifest,
    projectDir: context.config?.root,
    includeGeneratedCSS: context.includeGeneratedCSS
  })
  context.emittedGlobals = result.emittedGlobals
  return result
}

export default async function getExtractedCSS(context: MasterCSSVitePluginContext): Promise<string> {
  return (await getExtractedCSSResult(context)).css
}
