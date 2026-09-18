import { resolve } from 'node:path'
import { compileCSS, resolveCSSImportGraphSource } from '../node-compiler'
import { resolveReferenceOrigins } from './reference-origins'
import { mapStylesheetError } from './source-context'
import type { CompileStylesheetOptions } from './types'
import type { CSSDirectiveReference, CSSOutputMapping } from '@master/css-schema/css-directives'

/** Resolve rendering inputs once, retaining references that flattening consumes. */
export function prepareRenderedSource(file: string, source: string, options: CompileStylesheetOptions): {
  source: string
  dependencies: string[]
  sourceMappings?: CSSOutputMapping[]
  root: string
  references: CSSDirectiveReference[]
  sources: Record<string, string>
} {
  const root = resolve(options.projectDir ?? '', file)
  const sources: Record<string, string> = {}
  const graph = resolveCSSImportGraphSource(root, source, {
    projectDir: options.projectDir,
    onDependency: options.onDependency,
    onSource(inputFile, inputSource) {
      sources[inputFile] = inputSource
      // Validate each original input before flattening so parser diagnostics keep
      // the actual file. Prepared root positions are mapped through the host map.
      try { compileCSS(inputSource, { from: inputFile }) }
      catch (error) { throw inputFile === root ? mapStylesheetError(error, root, options, source) : error }
    }
  })
  const references = (graph.references ?? []).flatMap(reference => {
    if (reference.file !== root || !options.sourceMap) return [reference]
    return resolveReferenceOrigins(source, [reference], options.baseFile ?? root, options.sourceMap)
  })
  return { ...graph, root, references, sources }
}
