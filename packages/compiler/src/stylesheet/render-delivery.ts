import { resourceOutputMappings } from './output-map'
import { compileDeliveredSource } from './delivery'
import { renderCompiledManifestCSS } from './render'
import { mapStylesheetError } from './source-context'
import type { CompileRenderedStylesheetResult, CompileRenderedStylesheetOptions } from './types'

/** Render generated globals once while keeping native stylesheet boundaries. */
export async function compileRenderedDelivery(id: string, source: string, options: CompileRenderedStylesheetOptions): Promise<CompileRenderedStylesheetResult> {
  try {
    const result = (await compileDeliveredSource(id, source, { ...options, transformNativeStylesheets: true }, options.classes))!
    const entry = result.stylesheets.find(asset => asset.id === result.entry)!
    const generated = renderCompiledManifestCSS({
      manifest: result.resolutionManifest,
      nativeCSS: result.stylesheets.map(asset => asset.css),
      classNames: options.classes,
      emittedGlobals: { ...options.emittedGlobals, suppressedKeyframes: result.directives.suppressedKeyframes }
    })
    const nativeCSS = generated.stylesheets[result.stylesheets.indexOf(entry)] ?? entry.css
    const css = [nativeCSS, generated.generatedCSS].filter(Boolean).join('\n\n')
    const shift = (nativeCSS ? nativeCSS.length + 2 : 0) - (generated.nativeCSS ? generated.nativeCSS.length + 2 : 0)
    const resourceMappings = generated.outputMappings.map(mapping => ({ ...mapping, generatedStart: mapping.generatedStart + shift, generatedEnd: mapping.generatedEnd === undefined ? undefined : mapping.generatedEnd + shift }))
    const sourceMap = result.outputMap(css, [...resourceOutputMappings(entry.outputMappings, generated.stylesheetEdits[result.stylesheets.indexOf(entry)]), ...resourceMappings])
    const renderedCSS = { ...generated, css, nativeCSS, outputMappings: resourceMappings }
    return {
      ...result.directives,
      entry: result.entry,
      stylesheets: result.stylesheets.map((asset, index) => asset.id === entry.id ? { ...asset, css, sourceMap } : { ...asset, css: generated.stylesheets[index] ?? asset.css, sourceMap: result.outputMap(generated.stylesheets[index] ?? asset.css, resourceOutputMappings(asset.outputMappings, generated.stylesheetEdits[index]), asset.id) }),
      resources: result.resources,
      sourceMap,
      css, nativeCSS, generatedCSS: generated.generatedCSS,
      emittedGlobals: generated.emittedGlobals, manifest: result.manifest, renderedCSS
    }
  } catch (error) {
    throw mapStylesheetError(error, id, { baseFile: options.delivery?.baseFile ?? options.baseFile, sourceMap: options.delivery?.sourceMap ?? options.sourceMap }, source)
  }

}
