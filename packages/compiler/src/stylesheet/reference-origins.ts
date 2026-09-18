import { SourceMap } from 'node:module'
import { isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { CSSDirectiveReference } from '@master/css-schema/css-directives'

/** Adapt Rust reference offsets through a host map; CSS parsing stays in Rust. */
export function resolveReferenceOrigins(source: string, references: readonly CSSDirectiveReference[], owner: string, serializedMap?: string) {
  if (!serializedMap || !references.length) return references
  if (!isAbsolute(owner)) throw new TypeError('A stylesheet source map requires an absolute filesystem baseFile.')
  const raw = JSON.parse(serializedMap) as ConstructorParameters<typeof SourceMap>[0]
  const map = new SourceMap(raw)
  const base = new URL(raw.sourceRoot ? raw.sourceRoot.replace(/\/?$/, '/') : './', pathToFileURL(owner))
  return references.map(reference => {
    const start = 'start' in reference ? reference.start : undefined
    if (typeof start !== 'number' || !Number.isInteger(start) || start < 0 || start >= source.length) throw new TypeError('A mapped CSS reference requires its compiler-provided source offset.')
    const prefix = source.slice(0, start).split(/\r\n?|\n/)
    const line = prefix.length - 1, column = prefix[line].length
    const origin = map.findEntry(line, column)
    if (!('originalSource' in origin) || !origin.originalSource || origin.originalSource.includes('\0') || origin.generatedLine !== line) {
      throw new TypeError(`Original source unavailable for mapped CSS reference: ${reference.source}`)
    }
    const url = new URL(origin.originalSource, base)
    if (url.protocol !== 'file:') throw new TypeError(`CSS reference source must identify a filesystem file: ${url.href}`)
    return { ...reference, file: fileURLToPath(url) }
  })
}
