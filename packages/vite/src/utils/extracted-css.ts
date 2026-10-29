import { withSassDiagnostics } from './sass-diagnostics'
import type { MasterCSSVitePluginContext } from '../core'
import { getScanner } from './scanner-context'
import { getBuildStylesheetDelivery } from './build-stylesheet-delivery'
import { getDevStylesheetDelivery, publishDevStylesheets } from './dev-stylesheet-delivery'

const revisions = new WeakMap<MasterCSSVitePluginContext, number>()

export async function getExtractedCSSResult(context: MasterCSSVitePluginContext) {
  const revision = (revisions.get(context) ?? 0) + 1
  revisions.set(context, revision)
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
  if (revisions.get(context) === revision && context.scanner === scanner) {
    const changed = JSON.stringify(context.emittedGlobals) !== JSON.stringify(result.emittedGlobals)
    context.emittedGlobals = result.emittedGlobals
    if (changed) context.onEmittedGlobalsChange?.()
  }
  return result
}

export default async function getExtractedCSS(context: MasterCSSVitePluginContext): Promise<string> {
  const result = await getExtractedCSSResult(context)
  return context.config?.command === 'serve'
    ? publishDevStylesheets(context, result, getScanner(context).slotCSSRule)
    : result.css
}
