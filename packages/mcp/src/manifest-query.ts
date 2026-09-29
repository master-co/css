import { builtinTokenFamilies } from '@master/css-tooling/builtins'
import {
  flattenMasterCSSManifestVariables,
  type MasterCSSMixinDefinition
} from '@master/css-schema/manifest'
import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest, requireWorkspaceManifest, manifestMetadata, type SemanticContext } from './project'
import {
  compactMixin,
  compactVariable,
  summarizeManifest
} from './manifest-summary'

const MANIFEST_QUERY_VERSION = 4

export type ManifestQueryKind = 'all' | 'token' | 'mixin' | 'custom-media' | 'family'

export interface ManifestQueryOptions {
  context?: SemanticContext
  query?: string
  kind?: ManifestQueryKind
  namespace?: string
  limit?: number
}

function includesQuery(value: unknown, query: string) {
  if (!query) return true
  if (value === undefined || value === null) return false
  return String(value).toLowerCase().includes(query)
}

function matchesAny(values: unknown[], query: string) {
  return values.some((value) => includesQuery(value, query))
}

function limitResults<T>(items: T[], limit: number) {
  return items.slice(0, limit)
}

function mixinSearchValues(mixin: MasterCSSMixinDefinition) {
  return [mixin.name, ...(mixin.parameters ?? []).map(parameter => parameter.name)]
}

export async function queryManifest(context: MasterCSSMCPContext, options: ManifestQueryOptions = {}) {
  const manifest = await loadWorkspaceManifest(context, options.context)
  const query = (options.query || '').toLowerCase()
  const kind = options.kind || 'all'
  const namespace = options.namespace
  const limit = options.limit ?? 50

  const activeManifest = requireWorkspaceManifest(manifest)
  const variables = flattenMasterCSSManifestVariables(activeManifest.variables)
    .filter((variable) => !namespace || variable.namespace === namespace)
    .filter((variable) => matchesAny([
      variable.name,
      variable.key,
      variable.namespace,
      ...variable.values.flatMap(({ path, value }) => [...path, value])
    ], query))
    .map(compactVariable)

  const mixins = (activeManifest.mixins || [])
    .filter((mixin) => !namespace || mixin.name === `--${namespace}`)
    .filter((mixin) => matchesAny(mixinSearchValues(mixin), query))
    .map(compactMixin)

  const customMedia = Object.entries(activeManifest.customMedia ?? {}).filter(([name]) => includesQuery(name, query)).map(([name, expression]) => ({ name, expression }))

  const families = builtinTokenFamilies
    .map(({ prefix, property, namespaces }) => ({ type: 'token-family' as const, prefix, property, namespaces }))
    .filter(family => !namespace || family.namespaces.includes(namespace))
    .filter((family) => matchesAny(Object.values(family), query))

  const allResults = {
    tokens: kind === 'all' || kind === 'token' ? variables : [],
    mixins: kind === 'all' || kind === 'mixin' ? mixins : [],
    customMedia: kind === 'all' || kind === 'custom-media' ? customMedia : [],
    families: kind === 'all' || kind === 'family' ? families : []
  }
  const limitedResults = {
    tokens: limitResults(allResults.tokens, limit),
    mixins: limitResults(allResults.mixins, limit),
    customMedia: limitResults(allResults.customMedia, limit),
    families: limitResults(allResults.families, limit)
  }
  const total = Object.values(allResults).reduce((count, items) => count + items.length, 0)
  const returned = Object.values(limitedResults).reduce((count, items) => count + items.length, 0)

  return {
    version: MANIFEST_QUERY_VERSION,
    root: context.root,
    manifest: {
      ...manifestMetadata(manifest),
      status: manifest.status,
      entries: manifest.entries,
      summary: summarizeManifest(activeManifest)
    },
    inputs: {
      query: options.query,
      kind,
      namespace,
      limit
    },
    results: limitedResults,
    summary: {
      total,
      returned,
      tokens: variables.length,
      mixins: mixins.length,
      customMedia: customMedia.length,
      families: families.length,
      status: 'ok'
    }
  }
}
