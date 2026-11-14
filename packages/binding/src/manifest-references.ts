import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSCompiledStylesheetGraph, MasterCSSCompileStylesheetGraphRequest } from './protocol'

/**
 * Manifests a compiler binding stores by content. A graph request references a
 * stored manifest as `{"$ref": key}` instead of carrying its ~0.7 MB of JSON, and
 * the compilation returns its manifests the same way.
 */
export interface MasterCSSManifestStore {
  /** Stores a manifest's JSON and returns its key; an identical text keeps its key. */
  register(manifestJSON: string): string
  /** A stored manifest's JSON, or `undefined` once the binding evicted it. */
  json(key: string): string | undefined
}

/** Rust `mastercss_compiler::UNKNOWN_MANIFEST_REFERENCE`. */
const UNKNOWN_MANIFEST_REFERENCE = 'Unknown Master CSS manifest reference'

interface ManifestReference { $ref: string }

class StaleManifestReference extends Error { }

function deepFreeze(value: unknown) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
}

const sharedManifests = new WeakSet<object>()

/**
 * Deeply freezes a manifest so bindings can identify it by reference: its stored
 * key and serialization are then reused instead of recomputed per call.
 */
export function shareManifest<T extends MasterCSSManifest>(manifest: T): T {
  deepFreeze(manifest)
  sharedManifests.add(manifest)
  return manifest
}

export function isSharedManifest(manifest: object) {
  return sharedManifests.has(manifest)
}

const serializedManifests = new WeakMap<object, string>()

/** `serializeMasterCSSManifest`, reused for a shared manifest. */
export function serializeSharedManifest(manifest: MasterCSSManifest, serialize: (manifest: MasterCSSManifest) => string) {
  if (!sharedManifests.has(manifest)) return serialize(manifest)
  let json = serializedManifests.get(manifest)
  if (json === undefined) serializedManifests.set(manifest, json = serialize(manifest))
  return json
}

/**
 * Keys of the manifests one store holds. Only shared manifests are remembered by
 * identity, since a mutable object may change after it was stored; others are
 * serialized per request and the store deduplicates them by content. Manifests a
 * compilation returns are shared, so passing one back costs nothing.
 */
class ManifestReferences {
  readonly #keys = new WeakMap<object, string>()
  readonly #manifests = new Map<string, WeakRef<MasterCSSManifest>>()
  readonly #collected = new FinalizationRegistry<string>((key) => {
    if (!this.#manifests.get(key)?.deref()) this.#manifests.delete(key)
  })

  #remember(manifest: MasterCSSManifest, key: string) {
    this.#keys.set(manifest, key)
    this.#manifests.set(key, new WeakRef(manifest))
    this.#collected.register(manifest, key)
  }

  #forget(key: string) {
    const manifest = this.#manifests.get(key)?.deref()
    if (manifest) this.#keys.delete(manifest)
    this.#manifests.delete(key)
  }

  #reference(store: MasterCSSManifestStore, manifest: MasterCSSManifest | undefined, used: string[]) {
    if (!manifest) return manifest
    let key = this.#keys.get(manifest)
    if (!key) {
      key = store.register(JSON.stringify(manifest))
      if (sharedManifests.has(manifest)) this.#remember(manifest, key)
    }
    used.push(key)
    return { $ref: key } satisfies ManifestReference
  }

  #resolve(store: MasterCSSManifestStore, value: MasterCSSManifest | ManifestReference): MasterCSSManifest {
    if (!('$ref' in value)) return value
    const known = this.#manifests.get(value.$ref)?.deref()
    if (known) return known
    const json = store.json(value.$ref)
    if (json === undefined) throw new StaleManifestReference(value.$ref)
    const manifest = shareManifest(JSON.parse(json) as MasterCSSManifest)
    this.#remember(manifest, value.$ref)
    return manifest
  }

  /**
   * Compiles `request` with referenced manifests. A reference the store evicted
   * meanwhile falls back to the original request, which carries its manifests.
   */
  compileGraph(
    store: MasterCSSManifestStore,
    request: MasterCSSCompileStylesheetGraphRequest,
    compile: (request: MasterCSSCompileStylesheetGraphRequest) => MasterCSSCompiledStylesheetGraph
  ): MasterCSSCompiledStylesheetGraph {
    const used: string[] = []
    try {
      const result = compile({
        ...request,
        baseManifest: this.#reference(store, request.baseManifest, used),
        resolutionManifest: this.#reference(store, request.resolutionManifest, used),
        manifestRefs: true
      } as MasterCSSCompileStylesheetGraphRequest)
      return {
        ...result,
        manifest: this.#resolve(store, result.manifest),
        resolutionManifest: this.#resolve(store, result.resolutionManifest)
      }
    } catch (error) {
      const stale = error instanceof StaleManifestReference
        || String((error as Error | undefined)?.message ?? error).includes(UNKNOWN_MANIFEST_REFERENCE)
      if (!stale) throw error
      for (const key of used) this.#forget(key)
      if (error instanceof StaleManifestReference) this.#forget(error.message)
      return compile(request)
    }
  }
}

const references = new WeakMap<MasterCSSManifestStore, ManifestReferences>()

export function compileGraphWithManifestStore(
  store: MasterCSSManifestStore,
  request: MasterCSSCompileStylesheetGraphRequest,
  compile: (request: MasterCSSCompileStylesheetGraphRequest) => MasterCSSCompiledStylesheetGraph
): MasterCSSCompiledStylesheetGraph {
  let stored = references.get(store)
  if (!stored) references.set(store, stored = new ManifestReferences())
  return stored.compileGraph(store, request, compile)
}
