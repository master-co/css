import { SourceMap } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'
import type { ValidationSource } from '../value-validation'
import type { CSSDirectiveSourceReference, CSSOutputMapping } from '@master/css-schema/css-directives'

type MapPayload = ConstructorParameters<typeof SourceMap>[0]
export interface StylesheetOutputContext {
  file: string
  source: string
  compilationFile: string
  sourceMap?: string
  graph?: { sourceMappings?: CSSOutputMapping[], sources: Record<string, string> }
}
interface Origin { source: string, line: number, column: number, content: string | null }
interface Point { offset: number, origin?: Origin }
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function vlq(value: number) {
  let encoded = '', bits = value < 0 ? -value * 2 + 1 : value * 2
  do { const digit = bits % 32; bits = Math.floor(bits / 32); encoded += alphabet[digit + (bits ? 32 : 0)] } while (bits)
  return encoded
}
function positions(source: string) {
  const starts = [0]
  for (const match of source.matchAll(/\r\n?|\n/g)) starts.push(match.index + match[0].length)
  return (offset: number) => {
    let low = 0, high = starts.length
    while (low < high) { const mid = (low + high) >>> 1; if (starts[mid] <= offset) low = mid + 1; else high = mid }
    const line = Math.max(0, low - 1)
    return { line, column: offset - starts[line] }
  }
}

function sourceURL(source: string, owner: string) {
  return new URL(source, pathToFileURL(owner)).href
}

/** Chain only compiler-provided offsets and host maps. No CSS parsing or matching. */
function origins(context: StylesheetOutputContext) {
  let payload: MapPayload | undefined, inputMap: SourceMap | undefined, invalidMap = false
  try { payload = context.sourceMap ? JSON.parse(context.sourceMap) as MapPayload : undefined; inputMap = payload ? new SourceMap(payload) : undefined }
  catch { payload = undefined; invalidMap = true }
  const indices = new Map<string, ReturnType<typeof positions>>()
  const locate = (content: string, offset: number) => {
    let index = indices.get(content)
    if (!index) { index = positions(content); indices.set(content, index) }
    return index(offset)
  }
  const preparedLines = context.source.split(/\r\n?|\n/)
  const authoredLines = payload?.sourcesContent?.map(content => content?.split(/\r\n?|\n/))
  const sourceBase = new URL(payload?.sourceRoot ? payload.sourceRoot.replace(/\/?$/, '/') : './', pathToFileURL(context.file))
  return (reference: CSSDirectiveSourceReference): Origin | undefined => {
    let file = reference.file ?? context.compilationFile, offset = reference.range.start
    if (file === context.compilationFile && context.graph?.sourceMappings) {
      const spans = context.graph.sourceMappings
      let low = 0, high = spans.length
      while (low < high) { const mid = (low + high) >>> 1; if (spans[mid].generatedStart <= offset) low = mid + 1; else high = mid }
      const span = spans[low - 1]
      if (offset >= (span?.generatedEnd ?? 0)) return
      if (!span?.source.file) return
      file = span.source.file
      offset = span.source.range.start + offset - span.generatedStart
    }
    const content = file === context.file ? context.source : context.graph?.sources[file]
    const point = content !== undefined ? locate(content, offset)
      : reference.loc ? { line: reference.loc.start.line - 1, column: reference.loc.start.column - 1 } : undefined
    if (!point) return
    if (file === context.file && inputMap && payload) {
      const entry = inputMap.findEntry(point.line, point.column)
      if (!('originalSource' in entry) || !entry.originalSource || entry.generatedLine !== point.line) return
      const originalContent = payload.sourcesContent?.[payload.sources.indexOf(entry.originalSource)] ?? null
      let column = entry.originalColumn
      // Refinement is valid only for an unchanged host-map segment; expanded
      // interpolation retains the host's original segment anchor instead.
      const length = point.column - entry.generatedColumn
      const prepared = preparedLines[point.line]
      const authored = authoredLines?.[payload.sources.indexOf(entry.originalSource)]?.[entry.originalLine]
      if (length > 0 && prepared !== undefined && authored !== undefined
        && prepared.slice(entry.generatedColumn, point.column) === authored.slice(entry.originalColumn, entry.originalColumn + length)) column += length
      return { source: new URL(entry.originalSource, sourceBase).href, line: entry.originalLine, column, content: originalContent }
    }
    return { source: sourceURL(file, context.file) + (invalidMap && file === context.file ? '?master-css-preprocessed' : ''), ...point, content: content ?? null }
  }
}

function serializeMap(code: string, points: Point[]) {
  const locate = positions(code)
  const sources: string[] = [], sourcesContent: (string | null)[] = [], lines: string[][] = []
  const offsets = new Map<number, Origin | undefined>()
  // A mapped point takes precedence over an adjacent range's terminating marker.
  for (const point of points) if (point.origin || !offsets.has(point.offset)) offsets.set(point.offset, point.origin)
  let lastSource = 0, lastLine = 0, lastColumn = 0, generatedLine = -1, generatedColumn = 0
  for (const [offset, origin] of [...offsets].sort(([a], [b]) => a - b)) {
    if (offset < 0 || offset > code.length) continue
    const point = locate(offset)
    if (point.line !== generatedLine) { generatedLine = point.line; generatedColumn = 0 }
    while (lines.length <= point.line) lines.push([])
    const segment = [point.column - generatedColumn]
    generatedColumn = point.column
    if (origin) {
      let index = sources.indexOf(origin.source)
      if (index === -1) { index = sources.length; sources.push(origin.source); sourcesContent.push(origin.content) }
      segment.push(index - lastSource, origin.line - lastLine, origin.column - lastColumn)
      lastSource = index; lastLine = origin.line; lastColumn = origin.column
    }
    lines[point.line].push(segment.map(vlq).join(''))
  }
  return JSON.stringify({ version: 3, sources, sourcesContent, names: [], mappings: lines.map(line => line.join(',')).join(';') })
}

export function stylesheetOutputMap(code: string, mappings: readonly CSSOutputMapping[], context: StylesheetOutputContext, mappedLength = code.length) {
  const origin = origins(context)
  const points = mappings.flatMap(mapping => [
    { offset: mapping.generatedStart, origin: origin(mapping.source) },
    ...mapping.generatedEnd === undefined ? [] : [{ offset: mapping.generatedEnd }]
  ])
  // Keep any renderer-appended classes/resources outside authoring attribution.
  points.push({ offset: mappedLength })
  return serializeMap(code, points)
}

/** The concatenation order is supplied by the owning compiler result. */
export function stylesheetOutputMappings(nativeCSS: string, native: readonly CSSOutputMapping[] = [], generated: readonly CSSOutputMapping[] = []) {
  const shift = nativeCSS.length ? nativeCSS.length + 1 : 0
  return [...native, ...generated.map(mapping => ({ ...mapping, generatedStart: mapping.generatedStart + shift,
    generatedEnd: mapping.generatedEnd === undefined ? undefined : mapping.generatedEnd + shift }))]
}

/** Exact graph copies also form the input map for structured lowering errors. */
export function stylesheetInputMap(code: string, context: StylesheetOutputContext) {
  const origin = origins(context), points: Point[] = []
  for (const span of context.graph?.sourceMappings ?? []) {
    const end = span.generatedEnd ?? span.generatedStart
    const offsets = [span.generatedStart, ...Array.from(code.slice(span.generatedStart, end).matchAll(/\r\n?|\n/g), match => span.generatedStart + match.index + match[0].length)]
    for (const offset of offsets) if (offset < end) points.push({ offset, origin: origin({ file: context.compilationFile, range: { start: offset, end: offset } }) })
    points.push({ offset: end })
  }
  return serializeMap(code, points)
}

/** Map validation to the same authoring segments as browser devtools. */
export function stylesheetValidationSource(css: string, source?: string, sourceMap?: string, mappings?: readonly CSSOutputMapping[]): ValidationSource {
  if (!sourceMap) return { css, source, mappings }
  let payload: MapPayload, map: SourceMap
  try { payload = JSON.parse(sourceMap) as MapPayload; map = new SourceMap(payload) }
  catch { return { css, source } }
  const locate = positions(css)
  return { css, source, locate(range) {
    const start = locate(range.start), end = locate(range.end)
    const entry = map.findEntry(start.line, start.column)
    if (!('originalSource' in entry) || !entry.originalSource || entry.generatedLine !== start.line) return
    const url = new URL(entry.originalSource, pathToFileURL(source ?? '/'))
    const file = url.protocol === 'file:' ? fileURLToPath(url) : url.href
    const original = payload.sourcesContent?.[payload.sources.indexOf(entry.originalSource)]?.split(/\r\n?|\n/)[entry.originalLine]
    const generated = css.split(/\r\n?|\n/)[start.line]
    const offset = start.column - entry.generatedColumn, length = end.column - entry.generatedColumn
    const exact = start.line === end.line && offset >= 0 && length >= offset && original !== undefined
      && original.slice(entry.originalColumn, entry.originalColumn + length) === generated.slice(entry.generatedColumn, end.column)
    return { source: file, range: {
      start: { line: entry.originalLine, character: entry.originalColumn + (exact ? offset : 0) },
      end: { line: entry.originalLine, character: entry.originalColumn + (exact ? length : 0) }
    } }
  } }
}
