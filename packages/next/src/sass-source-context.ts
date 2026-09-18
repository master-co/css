import { fileURLToPath } from 'node:url'

type SassMap = { version: number; sources: string[]; sourcesContent?: (string | null)[]; sourceRoot?: string; mappings: string }
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function decode(segment: string) {
  const values: number[] = []
  let value = 0, shift = 0
  for (const character of segment) {
    const digit = alphabet.indexOf(character)
    if (digit < 0) throw new TypeError('Invalid Sass source-map VLQ')
    value += (digit % 32) * 2 ** shift
    if (digit >= 32) { shift += 5;continue }
    values.push(value % 2 ? -Math.floor(value / 2) : value / 2)
    value = 0;shift = 0
  }
  if (shift) throw new TypeError('Incomplete Sass source-map VLQ')
  return values
}
function encode(value: number) {
  let remaining = Math.abs(value) * 2 + (value < 0 ? 1 : 0), result = ''
  do {
    const digit = remaining % 32
    remaining = Math.floor(remaining / 32)
    result += alphabet[digit + (remaining ? 32 : 0)]
  } while (remaining)
  return result
}

/** Only translate the host-inserted prefix; Sass owns the generated mappings. */
export function removeSassPrefixMap(map: object | undefined, url: URL, source: string, prefix: string) {
  if (!map || !prefix) return map
  const raw = map as SassMap
  const base = new URL(raw.sourceRoot ? raw.sourceRoot.replace(/\/?$/, '/') : './', url)
  const index = raw.sources.findIndex(value => new URL(value, base).href === url.href)
  if (index < 0) return map
  const lines = prefix.split(/\r\n?|\n/).length - 1
  const sources = [...raw.sources], sourcesContent = [...raw.sourcesContent ?? []]
  const injected = sources.length
  sources.push(url.href + '?master-css-additional-data')
  sourcesContent[index] = source;sourcesContent[injected] = prefix
  let oldSource = 0, oldLine = 0, nextSource = 0, nextLine = 0
  const mappings = raw.mappings.split(';').map(line => line.split(',').map(segment => {
    if (!segment) return segment
    const fields = decode(segment)
    if (fields.length < 4) return segment
    oldSource += fields[1];oldLine += fields[2]
    const root = oldSource === index, inserted = root && oldLine < lines
    const mappedSource = inserted ? injected : oldSource, mappedLine = root && !inserted ? oldLine - lines : oldLine
    fields[1] = mappedSource - nextSource;fields[2] = mappedLine - nextLine
    nextSource = mappedSource;nextLine = mappedLine
    return fields.map(encode).join('')
  }).join(',')).join(';')
  return { ...raw, sources, sourcesContent, mappings }
}

type Position = { line: number; column: number; offset: number }
type SassError = Error & { sassMessage?: string; span?: { url?: URL; start: Position; end: Position; text: string; context?: string } }
export function removeSassPrefixError(error: unknown, url: URL, source: string, prefix: string): unknown {
  const original = error as SassError
  if (!prefix || !original?.span || original.span.url?.href !== url.href) return error
  const lines = prefix.split(/\r\n?|\n/).length - 1, inserted = original.span.start.line < lines
  const mappedURL = inserted ? new URL(url.href + '?master-css-additional-data') : url
  const position = (value: Position) => ({ ...value, line: value.line - (inserted ? 0 : lines), offset: value.offset - (inserted ? 0 : prefix.length) })
  const span = { url: mappedURL, start: position(original.span.start), end: position(original.span.end), text: original.span.text, context: original.span.context }
  const line = (inserted ? prefix : source).split(/\r\n?|\n/)[span.start.line] ?? ''
  const file = inserted ? mappedURL.href : fileURLToPath(mappedURL)
  const mapped = new Error(`${original.sassMessage ?? original.message}\n${file}:${span.start.line + 1}:${span.start.column + 1}\n${line}`, { cause: original })
  return Object.assign(mapped, { name: original.name, sassMessage: original.sassMessage, span })
}
