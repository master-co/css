import { withSassDiagnostics } from './sass-diagnostics'
import type { MasterCSSVitePluginContext } from '../core'
import { getScanner } from './scanner-context'
import { getBuildStylesheetDelivery } from './build-stylesheet-delivery'
import { getDevStylesheetDelivery, publishDevStylesheets } from './dev-stylesheet-delivery'
import { markSharedGlobalsDelivered, renderSharedGlobals, sharedGlobalsStale } from './shared-globals'

const revisions = new WeakMap<MasterCSSVitePluginContext, number>()

async function composeExtractedCSS(context: MasterCSSVitePluginContext) {
  const revision = (revisions.get(context) ?? 0) + 1
  revisions.set(context, revision)
  const scanner = getScanner(context)
  if (!context.stylesheets) {
    const { createStylesheetCollection } = await import('@master/css-compiler/stylesheet')
    context.stylesheets = createStylesheetCollection()
  }
  const composed = await withSassDiagnostics(context, () => context.stylesheets!.compose({
    scanner,
    baseManifest: scanner.css.manifest,
    projectDir: context.config?.root, pruneNativeCSS: context.pruneNativeCSS,
    includeGeneratedCSS: context.includeGeneratedCSS,
    delivery: getBuildStylesheetDelivery(context) ?? getDevStylesheetDelivery(context)
  }))
  // Local stylesheets leave the globals they share with the project to this output.
  const shared = renderSharedGlobals(context, composed.emittedGlobals)
  const result = shared?.css
    ? { ...composed, css: [composed.css, shared.css].filter(Boolean).join('\n'), emittedGlobals: shared.emittedGlobals }
    : composed
  if (revisions.get(context) === revision && context.scanner === scanner) {

    const changed = JSON.stringify(context.emittedGlobals) !== JSON.stringify(result.emittedGlobals)
    context.emittedGlobals = result.emittedGlobals
    if (changed) context.onEmittedGlobalsChange?.()
  }
  return { result, base: composed.emittedGlobals, sharedCSS: shared?.css ?? '' }
}

export async function getExtractedCSSResult(context: MasterCSSVitePluginContext) {
  return (await composeExtractedCSS(context)).result
}

export default async function getExtractedCSS(context: MasterCSSVitePluginContext): Promise<string> {
  const { result, base, sharedCSS } = await composeExtractedCSS(context)
  if (context.config?.command !== 'serve') return result.css
  // Only a published entry carries them; metadata reads leave the entries as they were.
  markSharedGlobalsDelivered(context, base, sharedCSS)
  // A local stylesheet registered while this composition was in flight.
  if (sharedGlobalsStale(context)) context.onSharedGlobalsChange?.()
  return publishDevStylesheets(context, result, getScanner(context).slotCSSRule)
}
