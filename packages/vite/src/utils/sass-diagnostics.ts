import { SourceMap } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { MasterCSSError, type MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSVitePluginContext } from '../core'
import { getPreparedSassDiagnosticSource } from './build-sass-source'

const mappedErrors = new WeakSet<MasterCSSError>()

async function mapDiagnostic(context: MasterCSSVitePluginContext, diagnostic: MasterCSSDiagnostic): Promise<MasterCSSDiagnostic> {
  if (!diagnostic.source || !diagnostic.range) return diagnostic
  const cached = await getPreparedSassDiagnosticSource(context, diagnostic.source)
  if (!cached) return diagnostic
  const language = cached.file.endsWith('.css') ? 'CSS Modules' : 'Sass'
  const unavailable = { ...diagnostic, source: cached.generatedID, notes: [...diagnostic.notes ?? [], `Original ${language} location is unavailable; this range refers to preprocessed CSS.`] }
  const prepared = cached.prepared
  const raw = typeof prepared.map === 'string' ? JSON.parse(prepared.map) as Exclude<typeof prepared.map, string> : prepared.map
  if (!raw || !('version' in raw) || !('sources' in raw) || !Array.isArray(raw.sources) || !raw.mappings) return unavailable
  const sourcesContent = 'sourcesContent' in raw ? raw.sourcesContent ?? [] : []
  const sourceRoot = 'sourceRoot' in raw ? raw.sourceRoot ?? '' : ''
  const map = new SourceMap({ version: 3, file: cached.file, sourceRoot, sources: raw.sources.map(source => source ?? ''), sourcesContent: sourcesContent.map(source => source ?? ''), names: 'names' in raw ? raw.names ?? [] : [], mappings: raw.mappings })
  const { start, end } = diagnostic.range
  const origin = map.findEntry(start.line, start.character)
  if (!('originalSource' in origin) || !origin.originalSource || origin.originalSource.includes('\0') || origin.generatedLine !== start.line) return unavailable
  const root = new URL(sourceRoot ? sourceRoot.replace(/\/?$/, '/') : './', pathToFileURL(cached.file))
  const url = new URL(origin.originalSource, root)
  const source = url.protocol === 'file:' ? fileURLToPath(url) : url.href
  if (source.includes('\0')) return unavailable
  const position = { line: origin.originalLine, character: origin.originalColumn }
  let original = sourcesContent[raw.sources.indexOf(origin.originalSource)]
  // Vite's string additionalData map omits its original source content. A
  // callback without a map instead labels its modified text as the root file.
  if (source === cached.file) {
    if (original != null && original !== cached.source) return unavailable
    original = cached.source
  }
  const generatedLine = prepared.code.split(/\r\n?|\n/)[start.line]
  const originalLine = typeof original === 'string' ? original.split(/\r\n?|\n/)[origin.originalLine] : undefined
  const offset = start.character - origin.generatedColumn
  const length = end.character - origin.generatedColumn
  // A source map locates a segment, not necessarily each expanded Sass token.
  // Refine columns only when the complete generated prefix/span is unchanged.
  if (start.line === end.line && offset >= 0 && length >= offset && generatedLine !== undefined && originalLine !== undefined
    && originalLine.slice(origin.originalColumn, origin.originalColumn + length) === generatedLine.slice(origin.generatedColumn, end.character)) {
    return { ...diagnostic, source, range: { start: { line: position.line, character: position.character + offset }, end: { line: position.line, character: position.character + length } } }
  }
  return { ...diagnostic, source, range: { start: position, end: position }, notes: [...diagnostic.notes ?? [], 'The source map identifies the originating segment; an exact original token range is unavailable.'] }
}

/** Keep compiler diagnostics intact while adapting preprocessing source locations. */
export async function withSassDiagnostics<T>(context: MasterCSSVitePluginContext, operation: () => Promise<T>): Promise<T> {
  try { return await operation() } catch (error) {
    if (!(error instanceof MasterCSSError) || mappedErrors.has(error)) throw error
    const diagnostics = await Promise.all(error.diagnostics.map(async diagnostic => {
      try { return await mapDiagnostic(context, diagnostic) } catch {
        return { ...diagnostic, notes: [...diagnostic.notes ?? [], 'Sass source mapping failed; the original compiler diagnostic is retained.'] }
      }
    }))
    if (diagnostics.every((diagnostic, index) => diagnostic === error.diagnostics[index])) throw error
    const mapped = new MasterCSSError({ ...error.toJSON(), diagnostics }, { cause: error })
    mappedErrors.add(mapped)
    const primary = diagnostics.find(diagnostic => diagnostic.source && diagnostic.range)
    if (primary?.range) Object.assign(mapped, { loc: { file: primary.source, line: primary.range.start.line + 1, column: primary.range.start.character } })
    throw mapped
  }
}
