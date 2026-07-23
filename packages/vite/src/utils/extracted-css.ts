import { createExtractedCSSResult } from '@master/css-compiler/stylesheet'
import type { MasterCSSVitePluginContext } from '../core'
import { getScanner } from './scanner-context'

export async function getExtractedCSSResult(context: MasterCSSVitePluginContext) {
  const scanner = getScanner(context)
  const result = await createExtractedCSSResult({
    scanner,
    stylesheetSources: context.stylesheetSources,
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
