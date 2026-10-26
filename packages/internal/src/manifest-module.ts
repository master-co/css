import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import { MANIFEST_ASSET_FILE, MANIFEST_MODULE_FILE } from './manifest-facade'

export type { MasterCSSManifest }

export const VIRTUAL_MANIFEST_ID = 'virtual:master-css-manifest'
export const RESOLVED_VIRTUAL_MANIFEST_ID = `\0${VIRTUAL_MANIFEST_ID}`
export const MASTER_CSS_MANIFEST_QUERY = '?master-css-manifest'
export const VIRTUAL_MANIFEST_FILE = MANIFEST_MODULE_FILE
export const VIRTUAL_MANIFEST_ASSET_FILE = MANIFEST_ASSET_FILE
export const EMPTY_MANIFEST_JSON = '{"version":6,"languageVersion":16}'

export interface CSSManifestLoadResult {
  manifest: MasterCSSManifest
  dependencies: string[]
  classNames?: string[]
  nativeClassNames?: string[]
  nativeCSS?: string
  css?: string
  generatedCSS?: string
  warnings?: string[]
}

export type CSSManifestJSONResult = CSSManifestLoadResult & {
  json: string
}

export function isMasterCSSManifestRequest(id: string) {
  return id.endsWith(MASTER_CSS_MANIFEST_QUERY)
}

export function stripMasterCSSManifestQuery(id: string) {
  return isMasterCSSManifestRequest(id)
    ? id.slice(0, -MASTER_CSS_MANIFEST_QUERY.length)
    : id
}

export function stripResourceQuery(resourcePath: string) {
  return resourcePath.replace(/[?#].*$/, '')
}

export function toManifestJSON(manifest: MasterCSSManifest) {
  return serializeMasterCSSManifest(manifest)
}

type MixinDefinition = NonNullable<MasterCSSManifest['mixins']>[number]
type MixinNode = MixinDefinition['body'][number]

function withoutSource<T extends { source?: unknown }>({ source: _source, ...value }: T) {
  return value
}

function withoutNodeSources(nodes: readonly MixinNode[]): MixinNode[] {
  return nodes.map(node => {
    switch (node.type) {
      case 'declaration': return withoutSource(node)
      case 'apply': return { ...withoutSource(node), ...(node.contents ? { contents: withoutNodeSources(node.contents) } : {}) }
      case 'rule':
      case 'condition': return { ...node, body: withoutNodeSources(node.body) }
      case 'contents': return { ...node, fallback: withoutNodeSources(node.fallback) }
    }
  })
}

function withoutDefinitionSources<T extends MixinDefinition>(definition: T): Omit<T, 'source'> {
  return {
    ...withoutSource(definition),
    ...(definition.parameters ? { parameters: definition.parameters.map(withoutSource) } : {}),
    body: withoutNodeSources(definition.body)
  }
}

/**
 * Production builds deliver manifests only to execute classes. Source
 * provenance locates definitions for tooling and names build-host paths,
 * which would leak them and make the asset vary with the checkout location.
 */
export function toProductionManifestJSON(manifest: MasterCSSManifest) {
  return toManifestJSON({
    ...manifest,
    ...(manifest.keyframes ? { keyframes: manifest.keyframes.map(withoutSource) } : {}),
    ...(manifest.mixins ? { mixins: manifest.mixins.map(withoutDefinitionSources) } : {}),
    ...(manifest.utilities ? { utilities: manifest.utilities.map(withoutDefinitionSources) } : {})
  })
}

export function toManifestJSONResult<T extends CSSManifestLoadResult>(result: T): T & { json: string } {
  return {
    ...result,
    json: toManifestJSON(result.manifest)
  }
}
