import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSCompiledStylesheetGraph, MasterCSSCompileStylesheetGraphRequest } from './protocol'

/** A manifest a compiler binding stores, named by `key` in graph requests. */
export interface MasterCSSStoredManifestHandle {
  readonly key: string
  /** The manifest JSON, or `undefined` once a non-retaining store dropped it. */
  json(): string | undefined
}

/**
 * Manifests a compiler binding stores. A graph request references a stored
 * manifest as `{"$ref": key}` instead of carrying its ~0.7 MB of JSON, and the
 * compilation returns its manifests the same way.
 */
export interface MasterCSSManifestStore {
  /** Validates and stores a manifest's JSON; an identical text keeps its entry. */
  register(manifestJSON: string): MasterCSSStoredManifestHandle
  /** The stored manifest a graph result names, or `undefined` once it was dropped. */
  handle(key: string): MasterCSSStoredManifestHandle | undefined
  /**
   * Whether a handle keeps its manifest alive. Without that guarantee references
   * read their manifest as soon as a compilation returns them.
   */
  readonly retains: boolean
}

/** Rust `mastercss_compiler::UNKNOWN_MANIFEST_REFERENCE`. */
const UNKNOWN_MANIFEST_REFERENCE = 'Unknown Master CSS manifest reference'

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
 * entry and serialization are then reused instead of recomputed per call.
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
 * A manifest a compiler binding holds, passed between compilations and render
 * sessions without reading it into JavaScript. `manifest()` reads it on demand
 * as a deeply frozen, shared object.
 */
export class MasterCSSManifestReference {
  readonly #store: MasterCSSManifestStore | undefined
  readonly #handle: MasterCSSStoredManifestHandle | undefined
  #manifest: MasterCSSManifest | undefined

  /** @internal Created by compiler bindings. */
  constructor(store: MasterCSSManifestStore | undefined, handle: MasterCSSStoredManifestHandle | undefined, manifest?: MasterCSSManifest) {
    this.#store = store
    this.#handle = handle
    this.#manifest = manifest
  }

  /** @internal The store that holds this manifest, if any. */
  get store() { return this.#store }

  /** @internal The binding's handle of this manifest, if any. */
  get handle() { return this.#handle }

  /** Serializes as the manifest it stands for, so results stay JSON documents. */
  toJSON(): MasterCSSManifest {
    return this.manifest()
  }

  manifest(): MasterCSSManifest {
    if (!this.#manifest) {
      const json = this.#handle?.json()
      if (json === undefined) throw new StaleManifestReference(this.#handle?.key ?? '')
      this.#manifest = shareManifest(JSON.parse(json) as MasterCSSManifest)
      references.get(this.#store!)?.remember(this.#manifest, this)
    }
    return this.#manifest
  }
}

/** A manifest, or a reference that stands for one. */
export type MasterCSSManifestSource = MasterCSSManifest | MasterCSSManifestReference

/** The manifest a source stands for, read on demand from a reference. */
export function manifestOf(source: MasterCSSManifestSource): MasterCSSManifest {
  return source instanceof MasterCSSManifestReference ? source.manifest() : source
}

export type MasterCSSReferencedStylesheetGraphRequest = Omit<MasterCSSCompileStylesheetGraphRequest, 'baseManifest' | 'resolutionManifest'> & {
  baseManifest?: MasterCSSManifestSource
  resolutionManifest?: MasterCSSManifestSource
}

export type MasterCSSReferencedStylesheetGraph = Omit<MasterCSSCompiledStylesheetGraph, 'manifest' | 'resolutionManifest'> & {
  manifest: MasterCSSManifestReference
  resolutionManifest: MasterCSSManifestReference
}

/**
 * The references of one store. Only shared manifests are matched by identity,
 * since a mutable object may change after it was stored; others are serialized
 * per request and the store deduplicates them by content. A key keeps one
 * reference while it is reachable, so its manifest is read at most once.
 */
class ManifestReferences {
  readonly #byManifest = new WeakMap<object, MasterCSSManifestReference>()
  readonly #byKey = new Map<string, WeakRef<MasterCSSManifestReference>>()
  readonly #collected = new FinalizationRegistry<string>((key) => {
    if (!this.#byKey.get(key)?.deref()) this.#byKey.delete(key)
  })

  constructor(readonly store: MasterCSSManifestStore) { }

  remember(manifest: MasterCSSManifest, reference: MasterCSSManifestReference) {
    this.#byManifest.set(manifest, reference)
  }

  #keep(reference: MasterCSSManifestReference) {
    const key = reference.handle!.key
    this.#byKey.set(key, new WeakRef(reference))
    this.#collected.register(reference, key)
    return reference
  }

  #forget(key: string) {
    this.#byKey.delete(key)
  }

  /** The reference that stands for `source` in this store. */
  reference(source: MasterCSSManifestSource): MasterCSSManifestReference {
    if (source instanceof MasterCSSManifestReference) {
      if (source.store === this.store && source.handle) return source
      source = source.manifest()
    }
    const known = this.#byManifest.get(source)
    if (known) return known
    const handle = this.store.register(JSON.stringify(source))
    // A shared manifest is the manifest its reference reads: keep it rather than parse it again.
    const reference = this.#byKey.get(handle.key)?.deref() ?? this.#keep(new MasterCSSManifestReference(this.store, handle, sharedManifests.has(source) ? source : undefined))
    if (sharedManifests.has(source)) this.#byManifest.set(source, reference)
    return reference
  }

  /** The reference for a key a compilation returned. */
  resolve(key: string): MasterCSSManifestReference {
    const known = this.#byKey.get(key)?.deref()
    if (known) return known
    const handle = this.store.handle(key)
    if (!handle) throw new StaleManifestReference(key)
    const reference = this.#keep(new MasterCSSManifestReference(this.store, handle))
    // Without a retaining handle, read the manifest while the store still has it.
    if (!this.store.retains) reference.manifest()
    return reference
  }

  /**
   * Runs `compile` with referenced manifests, which returns references to the
   * manifests it produced. A reference the store dropped meanwhile falls back to
   * compiling with the manifests themselves.
   */
  run<T extends { manifest: unknown, resolutionManifest: unknown }>(
    manifests: MasterCSSManifestSources,
    compile: (manifests: MasterCSSInlineOrReferencedManifests, manifestRefs: boolean) => T
  ): WithManifestReferences<T> {
    const used: string[] = []
    const reference = (source: MasterCSSManifestSource | undefined) => {
      if (!source) return undefined
      const { key } = this.reference(source).handle!
      used.push(key)
      return { $ref: key }
    }
    try {
      const result = compile({
        baseManifest: reference(manifests.baseManifest),
        resolutionManifest: reference(manifests.resolutionManifest)
      }, true)
      return {
        ...result,
        manifest: this.resolve((result.manifest as { $ref: string }).$ref),
        resolutionManifest: this.resolve((result.resolutionManifest as { $ref: string }).$ref)
      }
    } catch (error) {
      const stale = error instanceof StaleManifestReference
        || String((error as Error | undefined)?.message ?? error).includes(UNKNOWN_MANIFEST_REFERENCE)
      if (!stale) throw error
      for (const key of used) this.#forget(key)
      if (error instanceof StaleManifestReference) this.#forget(error.message)
      const result = compile(inlineManifests(manifests), false)
      return {
        ...result,
        manifest: this.reference(shareManifest(result.manifest as MasterCSSManifest)),
        resolutionManifest: this.reference(shareManifest(result.resolutionManifest as MasterCSSManifest))
      }
    }
  }
}

/** The manifests a compilation runs against. */
export interface MasterCSSManifestSources {
  readonly baseManifest?: MasterCSSManifestSource
  readonly resolutionManifest?: MasterCSSManifestSource
}

interface MasterCSSInlineOrReferencedManifests {
  readonly baseManifest?: MasterCSSManifest | { $ref: string }
  readonly resolutionManifest?: MasterCSSManifest | { $ref: string }
}

type WithManifestReferences<T> = Omit<T, 'manifest' | 'resolutionManifest'> & {
  manifest: MasterCSSManifestReference
  resolutionManifest: MasterCSSManifestReference
}

function inlineManifests(manifests: MasterCSSManifestSources) {
  return {
    baseManifest: manifests.baseManifest && manifestOf(manifests.baseManifest),
    resolutionManifest: manifests.resolutionManifest && manifestOf(manifests.resolutionManifest)
  }
}

/**
 * Runs a compilation whose manifests stay in the binding's store, or, without a
 * store, wraps the manifests a plain compilation returns.
 */
export function compileWithManifestReferences<T extends { manifest: unknown, resolutionManifest: unknown }>(
  store: MasterCSSManifestStore | undefined,
  manifests: MasterCSSManifestSources,
  compile: (manifests: MasterCSSInlineOrReferencedManifests, manifestRefs: boolean) => T
): WithManifestReferences<T> {
  if (!store) {
    const result = compile(inlineManifests(manifests), false)
    return {
      ...result,
      manifest: new MasterCSSManifestReference(undefined, undefined, shareManifest(result.manifest as MasterCSSManifest)),
      resolutionManifest: new MasterCSSManifestReference(undefined, undefined, shareManifest(result.resolutionManifest as MasterCSSManifest))
    }
  }
  let stored = references.get(store)
  if (!stored) references.set(store, stored = new ManifestReferences(store))
  return stored.run(manifests, compile)
}

const references = new WeakMap<MasterCSSManifestStore, ManifestReferences>()

/**
 * Compiles a graph whose manifests stay in the binding's store, or, without a
 * store, wraps the manifests a plain compilation returns.
 */
export function compileReferencedGraph(
  store: MasterCSSManifestStore | undefined,
  request: MasterCSSReferencedStylesheetGraphRequest,
  compile: (request: MasterCSSCompileStylesheetGraphRequest) => MasterCSSCompiledStylesheetGraph
): MasterCSSReferencedStylesheetGraph {
  return compileWithManifestReferences(store, request, (manifests, manifestRefs) => compile({
    ...request, ...manifests, ...(manifestRefs ? { manifestRefs: true } : {})
  } as unknown as MasterCSSCompileStylesheetGraphRequest))
}

/** Compiles a graph like {@link compileReferencedGraph}, returning the manifests themselves. */
export function compileGraphWithManifestStore(
  store: MasterCSSManifestStore,
  request: MasterCSSReferencedStylesheetGraphRequest,
  compile: (request: MasterCSSCompileStylesheetGraphRequest) => MasterCSSCompiledStylesheetGraph
): MasterCSSCompiledStylesheetGraph {
  const result = compileReferencedGraph(store, request, compile)
  return { ...result, manifest: result.manifest.manifest(), resolutionManifest: result.resolutionManifest.manifest() }
}
