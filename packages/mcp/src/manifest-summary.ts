import type {
  MasterCSSManifest,
  MasterCSSManifestConditions,
  MasterCSSManifestUtility,
  MasterCSSManifestVariableEntry
} from '@master/css-schema/manifest'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'

export function summarizeManifest(manifest: MasterCSSManifest) {
  const variables = flattenMasterCSSManifestVariables(manifest.variables)
  return {
    settings: manifest.settings ?? {},
    counts: {
      variables: variables.length,
      variableNamespaces: Object.keys(manifest.variables || {}).length,
      utilities: manifest.utilities?.length ?? 0,
      variants: manifest.variants?.length ?? 0,
      conditions: Object.keys(manifest.conditions || {}).length,
      breakpointConditions: Object.keys(manifest.breakpointConditions || {}).length,
      containerConditions: Object.keys(manifest.containerConditions || {}).length,
      selectors: Object.keys(manifest.selectors || {}).length,
      animations: Object.keys(manifest.animations || {}).length
    }
  }
}

export function compactVariable(variable: MasterCSSManifestVariableEntry) {
  return {
    name: variable.name,
    key: variable.key,
    namespace: variable.namespace || '',
    type: variable.type,
    value: variable.value,
    ...(variable.numeric ? { numeric: variable.numeric } : {}),
    ...(variable.modes ? { modes: Object.keys(variable.modes) } : {}),
    ...(variable.inline ? { inline: true } : {}),
    ...(variable.static ? { static: true } : {})
  }
}

export function compactUtility(utility: MasterCSSManifestUtility) {
  return {
    id: utility.id,
    ...(utility.name ? { name: utility.name } : {}),
    ...(utility.key ? { key: utility.key } : {}),
    ...(utility.subkey ? { subkey: utility.subkey } : {}),
    ...(utility.keys?.length ? { keys: utility.keys } : {}),
    ...(utility.namespaces?.length ? { namespaces: utility.namespaces } : {}),
    layer: utility.layer,
    matcherTypes: utility.matchers.map((matcher) => matcher.type),
    emitType: utility.emit.type,
    ...(utility.aliasGroups?.length ? { aliasGroups: utility.aliasGroups } : {}),
    ...(utility.variableAliasRefs?.length ? { variableAliasRefs: utility.variableAliasRefs } : {})
  }
}

export function compactConditions(conditions: MasterCSSManifestConditions | undefined) {
  return Object.entries(conditions || {}).map(([name, rule]) => ({
    name,
    id: rule.id,
    nodes: rule.nodes.length
  }))
}
