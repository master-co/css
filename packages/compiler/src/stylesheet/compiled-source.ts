import type { CSSOutputMapping } from '@master/css-schema/css-directives'
import { analyzeCSSDependencies, compileCSS, compileCSSManifestGraph, createManifestFromCSSResult, type CompileCSSResult, type CompileCSSManifestResult } from '../node-compiler'
import { prepareCSSImportGraph } from '../node-imports'
import { resolve } from 'node:path'
import { MasterCSSError } from '@master/css-schema'
import { resolveReferenceOrigins } from './reference-origins'
import { mapStylesheetError } from './source-context'
import { stylesheetOutputMap, stylesheetOutputMappings, stylesheetInputMap, type StylesheetOutputContext } from './output-map'
import type { CompileStylesheetOptions } from './types'
import { referenceFileInputs } from './reference-files'

/** Preserve input origins while joining parsed and lowered compiler output. */
export function compilePreparedStylesheet(filename: string, css: string, options: CompileStylesheetOptions, resolveImports: boolean): {
  compileOptions: Omit<CompileStylesheetOptions, 'projectDir' | 'loadSass' | 'baseManifest' | 'sourceMap' | 'baseFile' | 'onDependency' | 'references' | 'referenceFiles'>
  finalizedResult: CompileCSSManifestResult
  result: CompileCSSResult
  outputMap: (code: string, resources?: CSSOutputMapping[]) => string
} {
  const { projectDir, loadSass: _loadSass, baseManifest, sourceMap, baseFile, onDependency, referenceFiles, references: suppliedReferences, ...compileOptions } = options
  const hostReferences = referenceFileInputs(referenceFiles)
  onDependency?.(baseFile ?? filename)
  let compilationFile = filename
  const compilationSource = css
  let errorContext: StylesheetOutputContext | undefined
  try {
    if (resolveImports) {
      const root = resolve(projectDir ?? '', filename)
      compilationFile = root
      const graph = prepareCSSImportGraph(root, css, { projectDir, onDependency }, analyzeCSSDependencies)
      const context = { file: root, source: css, compilationFile: root, sourceMap, graph: { sources: graph.files } }
      errorContext = context
      const finalizedResult = compileCSSManifestGraph(graph, {
        ...compileOptions, baseManifest, from: root, root: projectDir, onDependency,
        referenceStack: [root], resolveReferenceResources: Boolean(referenceFiles?.length),
        mapReferences: (file, text, references) => file === root
          ? [...hostReferences, ...(suppliedReferences ?? resolveReferenceOrigins(text, references, baseFile ?? root, sourceMap))]
          : references
      })
      if (finalizedResult.stylesheets.length > 1) {
        throw new MasterCSSError({ code: 'CSS_IMPORT_ERROR', domain: 'compiler', message: 'This stylesheet retains import or resource boundaries and requires stylesheet asset delivery.' })
      }
      const outputMap = (code: string, resources: CSSOutputMapping[] = []) => stylesheetOutputMap(code, [...finalizedResult.outputMappings, ...resources], context, finalizedResult.css.length)
      return { compileOptions, finalizedResult, result: finalizedResult.directives, outputMap }
    }
    const context = { file: baseFile ?? filename, source: css, compilationFile, sourceMap }
    errorContext = context
    const result = compileCSS(compilationSource, { ...compileOptions, from: compilationFile })
    if (suppliedReferences) result.references = suppliedReferences
    else if (sourceMap && result.references) result.references = [...resolveReferenceOrigins(css, result.references, baseFile ?? filename, sourceMap)]
    if (hostReferences.length) result.references = [...hostReferences, ...(result.references ?? [])]
    const finalizedResult = createManifestFromCSSResult(result, { ...compileOptions, onDependency, baseManifest, root: projectDir, from: filename, sourceText: compilationSource, resolveReferenceResources: Boolean(referenceFiles?.length) })
    const mappings = finalizedResult.outputMappings ?? stylesheetOutputMappings(result.nativeCSS, result.nativeMappings, finalizedResult.generatedMappings)
    const outputMap = (code: string, resources: CSSOutputMapping[] = []) => stylesheetOutputMap(code, [...mappings, ...resources], context, finalizedResult.css.length)
    return { compileOptions, finalizedResult, result, outputMap }
  } catch (error) {
    const inputMap = errorContext?.graph?.sourceMappings ? stylesheetInputMap(compilationSource, errorContext) : sourceMap
    throw mapStylesheetError(error, compilationFile, { ...options, sourceMap: inputMap }, compilationSource)
  }
}
