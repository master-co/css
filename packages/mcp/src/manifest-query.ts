import { builtinTokenFamilies } from '@master/css-tooling/builtins'
import {
  flattenMasterCSSManifestVariables,
  type MasterCSSMixinDefinition
} from '@master/css-schema/manifest'
import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest, requireWorkspaceManifest, manifestMetadata, type SemanticContext } from './project'
import {
  compactConditions,
  compactMixin,
  compactVariable,
  summarizeManifest
} from './manifest-summary'

const MANIFEST_QUERY_VERSION = 3

export type ManifestQueryKind = 'all' | 'token' | 'mixin' | 'variant' | 'custom-media' | 'condition' | 'alias'

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

  const variants = (activeManifest.variants || [])
    .filter((variant) => includesQuery(variant.token, query))
    .map((variant) => ({
      token: variant.token,
      branches: variant.branches.length,
      layers: [...new Set(variant.branches.map((branch) => branch.layer).filter(Boolean))]
    }))

  const customMedia = Object.entries(activeManifest.customMedia ?? {}).filter(([name]) => includesQuery(name, query)).map(([name, expression]) => ({ name, expression }))

  const conditions = [
    ...compactConditions(activeManifest.conditions),
    ...compactConditions(activeManifest.containerConditions)
  ].filter((rule) => matchesAny([rule.name, rule.id], query))

  const aliases = builtinTokenFamilies.filter(family => family.prefix !== family.property)
    .map(({ prefix: alias, property, namespaces }) => ({ type: 'token-alias' as const, alias, property, namespaces }))
    .filter(alias => !namespace || alias.namespaces.includes(namespace))
    .filter((alias) => matchesAny(Object.values(alias), query))

  const allResults = {
    tokens: kind === 'all' || kind === 'token' ? variables : [],
    mixins: kind === 'all' || kind === 'mixin' ? mixins : [],
    variants: kind === 'all' || kind === 'variant' ? variants : [],
    customMedia: kind === 'all' || kind === 'custom-media' ? customMedia : [],
    conditions: kind === 'all' || kind === 'condition' ? conditions : [],
    aliases: kind === 'all' || kind === 'alias' ? aliases : []
  }
  const limitedResults = {
    tokens: limitResults(allResults.tokens, limit),
    mixins: limitResults(allResults.mixins, limit),
    variants: limitResults(allResults.variants, limit),
    customMedia: limitResults(allResults.customMedia, limit),
    conditions: limitResults(allResults.conditions, limit),
    aliases: limitResults(allResults.aliases, limit)
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
      variants: variants.length,
      customMedia: customMedia.length,
      conditions: conditions.length,
      aliases: aliases.length,
      status: 'ok'
    }
  }
}
