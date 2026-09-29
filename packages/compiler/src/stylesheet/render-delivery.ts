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
      emittedGlobals: options.emittedGlobals
    })
    const css = [entry.css, generated.generatedCSS].filter(Boolean).join('\n\n')
    const shift = (entry.css ? entry.css.length + 2 : 0) - (generated.nativeCSS ? generated.nativeCSS.length + 2 : 0)
    const resourceMappings = generated.outputMappings.map(mapping => ({ ...mapping, generatedStart: mapping.generatedStart + shift, generatedEnd: mapping.generatedEnd === undefined ? undefined : mapping.generatedEnd + shift }))
    const sourceMap = result.outputMap(css, [...entry.outputMappings, ...resourceMappings])
    const renderedCSS = { ...generated, css, nativeCSS: entry.css, outputMappings: resourceMappings }
    return {
      ...result.directives,
      entry: result.entry,
      stylesheets: result.stylesheets.map(asset => asset.id === entry.id ? { ...asset, css, sourceMap } : asset),
      resources: result.resources,
      sourceMap,
      css, nativeCSS: entry.css, generatedCSS: generated.generatedCSS,
      emittedGlobals: generated.emittedGlobals, manifest: result.manifest, renderedCSS
    }
  } catch (error) {
    throw mapStylesheetError(error, id, { baseFile: options.delivery?.baseFile ?? options.baseFile, sourceMap: options.delivery?.sourceMap ?? options.sourceMap }, source)
  }

}
