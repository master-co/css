import { readFileSync } from 'node:fs'
import type { SourceMap } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

type CSSMap = ConstructorParameters<typeof SourceMap>[0]

/** Read only assets reachable from the loader result; never scan stale output files. */
export function readStylesheetGraph(file: string, code: string, result = new Map<string, string>()) {
  if (result.has(file)) return result
  result.set(file, code)
  for (const [, href] of code.matchAll(/@import\s+["']([^"']+)["']/g)) if (href.startsWith('.')) {
    const target = fileURLToPath(new URL(href, pathToFileURL(file)))
    readStylesheetGraph(target, readFileSync(target, 'utf8'), result)
  }
  return result
}

export function readStylesheetText(file: string, code: string) {
  return [...readStylesheetGraph(file, code).values()].join('\n')
}

/** A synthetic import wrapper delegates author mappings to its published entry. */
export function readStylesheetEntry(file: string, code: string, sourceMap: CSSMap) {
  const importOnly = code.match(/^\s*@import\s+["']([^"']+)["'];\s*$/)
  if (!importOnly?.[1].startsWith('.')) return { code, sourceMap }
  const target = fileURLToPath(new URL(importOnly[1], pathToFileURL(file)))
  const css = readFileSync(target, 'utf8')
  const encoded = css.match(/sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/)?.[1]
  if (!encoded) throw new Error(`Published entry lacks its source map: ${target}`)
  return { code: css, sourceMap: JSON.parse(Buffer.from(encoded, 'base64').toString()) as CSSMap }
}
