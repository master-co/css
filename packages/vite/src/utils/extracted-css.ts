import { withSassDiagnostics } from './sass-diagnostics'
import type { MasterCSSVitePluginContext } from '../core'
import { getScanner } from './scanner-context'
import { getBuildStylesheetDelivery } from './build-stylesheet-delivery'
import { getDevStylesheetDelivery, publishDevStylesheets } from './dev-stylesheet-delivery'

export async function getExtractedCSSResult(context: MasterCSSVitePluginContext) {
  const scanner = getScanner(context)
  if (!context.stylesheets) {
    const { createStylesheetCollection } = await import('@master/css-compiler/stylesheet')
    context.stylesheets = createStylesheetCollection()
  }
  const result = await withSassDiagnostics(context, () => context.stylesheets!.compose({
    scanner,
    baseManifest: scanner.css.manifest,
    projectDir: context.config?.root, pruneNativeCSS: context.pruneNativeCSS,
    includeGeneratedCSS: context.includeGeneratedCSS,
    delivery: getBuildStylesheetDelivery(context) ?? getDevStylesheetDelivery(context)
  }))
  context.emittedGlobals = result.emittedGlobals
  return context.config?.command === 'serve'
    ? { ...result, css: publishDevStylesheets(context, result, scanner.slotCSSRule) }
    : result
}

export default async function getExtractedCSS(context: MasterCSSVitePluginContext): Promise<string> {
  return (await getExtractedCSSResult(context)).css
}
