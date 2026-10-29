import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { MasterCSSStylesheetCompositionOptions } from './public'
import type { CreateExtractedCSSResult, StylesheetSources } from './types'

function fileVersion(file: string) {
  try { return createHash('sha256').update(readFileSync(file)).digest('hex') } catch { return 'missing' }
}

/** One result, scoped to its collection. Class-sensitive compositions always run. */
export class StylesheetCompositionCache {
  generation = 0
  private entry?: { key: string, dependencies: string[], result: CreateExtractedCSSResult }
  private readonly functions = new WeakMap<object, number>()
  private nextFunction = 0

  clear() {
    this.generation++
    this.entry = undefined
  }

  private fingerprint(options: MasterCSSStylesheetCompositionOptions, sources: StylesheetSources, dependencies: readonly string[], version: (file: string) => string | undefined = fileVersion): string | undefined {
    if (options.includeGeneratedCSS !== false || options.pruneNativeCSS || options.onDiagnostic || options.loadSass || options.delivery?.resolveImport) return
    const hash = createHash('sha256')
    hash.update(JSON.stringify(options.projectDir ?? options.scanner.cwd))
    for (const [id, source] of sources) {
      if (!source.graph || !source.classIndependent) return
      hash.update(JSON.stringify([id, source]))
    }
    const { scanner: _scanner, signal: _signal, onDependency: _dependency, onDiagnostic: _diagnostic, ...input } = options
    hash.update(JSON.stringify(input, (_key, value) => {
      if (typeof value !== 'function') return value
      let id = this.functions.get(value)
      if (id === undefined) { id = ++this.nextFunction; this.functions.set(value, id) }
      return id
    }))
    for (const file of new Set([...sources.values()].flatMap(source => source.dependencies).concat([...dependencies]))) {
      const content = version(file)
      if (content === undefined) return
      hash.update(JSON.stringify([file, content]))
    }
    return hash.digest('hex')
  }

  get(options: MasterCSSStylesheetCompositionOptions, sources: StylesheetSources) {
    if (!this.entry || this.fingerprint(options, sources, this.entry.dependencies) !== this.entry.key) return
    const result = structuredClone(this.entry.result)
    for (const dependency of this.entry.dependencies) {
      options.onDependency?.(dependency)
      if (options.delivery?.onDependency !== options.onDependency) options.delivery?.onDependency?.(dependency)
    }
    return result
  }

  capture(options: MasterCSSStylesheetCompositionOptions, sources: StylesheetSources) {
    const versions = new Map<string, string>()
    const dependencies = [...(this.entry?.dependencies ?? []), ...(options.referenceFiles ?? [])]
    const key = this.fingerprint(options, sources, dependencies, file => {
      const version = fileVersion(file)
      versions.set(file, version)
      return version
    })
    return key ? { generation: this.generation, versions } : undefined
  }

  set(options: MasterCSSStylesheetCompositionOptions, sources: StylesheetSources, result: CreateExtractedCSSResult, captured: ReturnType<StylesheetCompositionCache['capture']>) {
    if (!captured || captured.generation !== this.generation) return
    const dependencies = [...new Set([...sources.values()].flatMap(source => source.dependencies).concat([...(result.dependencies ?? [])]))]
    const key = this.fingerprint(options, sources, dependencies)
    // New or changed dependencies during compilation need a fresh observation.
    const before = this.fingerprint(options, sources, dependencies, file => captured.versions.get(file))
    this.entry = key && key === before && JSON.stringify(result).length * 2 <= 4 * 1024 * 1024
      ? { key, dependencies, result: structuredClone(result) } : undefined
  }
}
