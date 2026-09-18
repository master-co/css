import { SourceMap } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { MasterCSSError } from '@master/css-schema'

export interface StylesheetSourceContext {
  readonly baseFile?: string
  readonly sourceMap?: string
  readonly onDependency?: (file: string) => void
}

const mappedErrors = new WeakSet<MasterCSSError>()

/** Translate host-prepared locations; parsing and diagnostic policy stay in Rust. */
export function mapStylesheetError(error: unknown, file: string, options: StylesheetSourceContext, preparedSource?: string): unknown {
  if (!(error instanceof MasterCSSError) || mappedErrors.has(error) || !options.sourceMap) return error
  try {
    const payload = JSON.parse(options.sourceMap) as ConstructorParameters<typeof SourceMap>[0]
    const map = new SourceMap(payload)
    const base = new URL(payload.sourceRoot ? payload.sourceRoot.replace(/\/?$/, '/') : './', pathToFileURL(options.baseFile ?? file))
    const mapped = new MasterCSSError({ ...error.payload, diagnostics: error.diagnostics.map(diagnostic => {
      if (diagnostic.source !== file || !diagnostic.range) return diagnostic
      const { start, end } = diagnostic.range
      const point = map.findEntry(start.line, start.character)
      if (!('originalSource' in point) || !point.originalSource || point.generatedLine !== start.line) {
        return { ...diagnostic, source: pathToFileURL(file).href + '?master-css-preprocessed', notes: [...diagnostic.notes ?? [], 'Original source location is unavailable; this range refers to preprocessed CSS.'] }
      }
      const url = new URL(point.originalSource, base)
      const source = url.protocol === 'file:' && !url.search && !url.hash ? fileURLToPath(url) : url.href
      const position = { line: point.originalLine, character: point.originalColumn }
      const generatedLine = preparedSource?.split(/\r\n?|\n/)[start.line]
      const originalLine = payload.sourcesContent?.[payload.sources.indexOf(point.originalSource)]?.split(/\r\n?|\n/)[point.originalLine]
      const offset = start.character - point.generatedColumn, length = end.character - point.generatedColumn
      // Sass segments may cover expanded interpolation. Refine only unchanged text.
      if (start.line === end.line && offset >= 0 && length >= offset && generatedLine !== undefined && originalLine !== undefined
        && originalLine.slice(point.originalColumn, point.originalColumn + length) === generatedLine.slice(point.generatedColumn, end.character)) {
        return { ...diagnostic, source, range: { start: { line: position.line, character: position.character + offset }, end: { line: position.line, character: position.character + length } } }
      }
      return { ...diagnostic, source, range: { start: position, end: position }, notes: [...diagnostic.notes ?? [], 'The source map identifies the originating segment; an exact original token range is unavailable.'] }
    }) }, { cause: error })
    mappedErrors.add(mapped)
    return mapped
  } catch {
    return new MasterCSSError({ ...error.payload, diagnostics: error.diagnostics.map(diagnostic => ({ ...diagnostic, notes: [...diagnostic.notes ?? [], 'Source mapping failed; the original compiler diagnostic is retained.'] })) }, { cause: error })
  }
}
