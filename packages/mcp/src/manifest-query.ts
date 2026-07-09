import {
  flattenMasterCSSManifestVariables,
  type MasterCSSManifestUtility
} from '@master/css-engine'
import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest } from './project'
import {
  compactConditions,
  compactUtility,
  compactVariable,
  summarizeManifest
} from './manifest-summary'

const MANIFEST_QUERY_VERSION = 1

export type ManifestQueryKind = 'all' | 'token' | 'utility' | 'variant' | 'mode' | 'condition' | 'alias'

export interface ManifestQueryOptions {
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

function utilitySearchValues(utility: MasterCSSManifestUtility) {
  return [
    utility.id,
    utility.name,
    utility.key,
    utility.subkey,
    ...(utility.keys || []),
    ...(utility.namespaces || []),
    ...(utility.aliasGroups || []),
    ...(utility.variableAliasRefs || []),
    ...utility.matchers.flatMap((matcher) => Object.values(matcher))
  ]
}

export async function queryManifest(context: MasterCSSMCPContext, options: ManifestQueryOptions = {}) {
  const manifest = await loadWorkspaceManifest(context)
  const query = (options.query || '').toLowerCase()
  const kind = options.kind || 'all'
  const namespace = options.namespace
  const limit = options.limit ?? 50

  if (manifest.status === 'error') {
    return {
      version: MANIFEST_QUERY_VERSION,
      root: context.root,
      manifest: {
        status: manifest.status,
        entries: manifest.entries,
        error: manifest.error
      },
      inputs: {
        query: options.query,
        kind,
        namespace,
        limit
      },
      results: {
        tokens: [],
        utilities: [],
        variants: [],
        modes: [],
        conditions: [],
        aliases: []
      },
      diagnostics: [
        {
          code: 'manifest-load-error',
          severity: 'error' as const,
          message: manifest.error,
          source: 'Master CSS',
          sourceKind: 'manifest'
        }
      ],
      summary: {
        total: 0,
        returned: 0,
        status: 'error'
      }
    }
  }

  const activeManifest = manifest.manifest
  const variables = flattenMasterCSSManifestVariables(activeManifest.variables)
    .filter((variable) => !namespace || variable.namespace === namespace)
    .filter((variable) => matchesAny([
      variable.name,
      variable.key,
      variable.namespace,
      variable.value
    ], query))
    .map(compactVariable)

  const utilities = (activeManifest.utilities || [])
    .filter((utility) => !namespace || utility.namespaces?.includes(namespace))
    .filter((utility) => matchesAny(utilitySearchValues(utility), query))
    .map(compactUtility)

  const variants = (activeManifest.variants || [])
    .filter((variant) => includesQuery(variant.token, query))
    .map((variant) => ({
      token: variant.token,
      branches: variant.branches.length,
      layers: [...new Set(variant.branches.map((branch) => branch.layer).filter(Boolean))]
    }))

  const modes = [
    ...(activeManifest.settings?.defaultMode ? [activeManifest.settings.defaultMode] : []),
    ...(activeManifest.settings?.modes || [])
  ].filter((mode, index, list) => list.indexOf(mode) === index)
    .filter((mode) => includesQuery(mode, query))
    .map((mode) => ({
      name: mode,
      default: mode === activeManifest.settings?.defaultMode,
      trigger: activeManifest.settings?.modeTrigger
    }))

  const conditions = [
    ...compactConditions(activeManifest.conditions),
    ...compactConditions(activeManifest.breakpointConditions),
    ...compactConditions(activeManifest.containerConditions)
  ].filter((rule) => matchesAny([rule.name, rule.id], query))

  const aliases = (activeManifest.utilities || [])
    .flatMap((utility) => [
      ...(utility.variableAliases || []).map(([key, name]) => ({
        utility: utility.id,
        key,
        name,
        type: 'variable-alias' as const
      })),
      ...(utility.variableAliasRefs || []).map((ref) => ({
        utility: utility.id,
        ref,
        type: 'variable-alias-ref' as const
      })),
      ...(utility.aliasGroups || []).map((group) => ({
        utility: utility.id,
        group,
        type: 'alias-group' as const
      }))
    ])
    .filter((alias) => matchesAny(Object.values(alias), query))

  const allResults = {
    tokens: kind === 'all' || kind === 'token' ? variables : [],
    utilities: kind === 'all' || kind === 'utility' ? utilities : [],
    variants: kind === 'all' || kind === 'variant' ? variants : [],
    modes: kind === 'all' || kind === 'mode' ? modes : [],
    conditions: kind === 'all' || kind === 'condition' ? conditions : [],
    aliases: kind === 'all' || kind === 'alias' ? aliases : []
  }
  const limitedResults = {
    tokens: limitResults(allResults.tokens, limit),
    utilities: limitResults(allResults.utilities, limit),
    variants: limitResults(allResults.variants, limit),
    modes: limitResults(allResults.modes, limit),
    conditions: limitResults(allResults.conditions, limit),
    aliases: limitResults(allResults.aliases, limit)
  }
  const total = Object.values(allResults).reduce((count, items) => count + items.length, 0)
  const returned = Object.values(limitedResults).reduce((count, items) => count + items.length, 0)

  return {
    version: MANIFEST_QUERY_VERSION,
    root: context.root,
    manifest: {
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
      utilities: utilities.length,
      variants: variants.length,
      modes: modes.length,
      conditions: conditions.length,
      aliases: aliases.length,
      status: 'ok'
    }
  }
}
