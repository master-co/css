import type {
  MasterCSSManifest,
  MasterCSSManifestConditions,
  MasterCSSMixinDefinition,
  MasterCSSManifestVariableEntry
} from '@master/css-schema/manifest'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'

export function summarizeManifest(manifest: MasterCSSManifest) {
  const variables = flattenMasterCSSManifestVariables(manifest.variables)
  return {
    languageVersion: manifest.languageVersion,
    theme: manifest.theme ?? [],
    counts: {
      variables: variables.length,
      variableNamespaces: Object.keys(manifest.variables || {}).length,
      mixins: manifest.mixins?.length ?? 0,
      variants: manifest.variants?.length ?? 0,
      conditions: Object.keys(manifest.conditions || {}).length,
      customMedia: Object.keys(manifest.customMedia || {}).length,
      containerConditions: Object.keys(manifest.containerConditions || {}).length,
      selectors: Object.keys(manifest.selectors || {}).length
    }
  }
}

export function compactVariable(variable: MasterCSSManifestVariableEntry) {
  return {
    ...variable,
    dependencies: [...(variable.dependencies ?? [])],
    name: variable.name,
    key: variable.key,
    namespace: variable.namespace || '',
    type: variable.type,
    values: variable.values,
    ...(variable.numeric ? { numeric: variable.numeric } : {})
  }
}

export function compactMixin(mixin: MasterCSSMixinDefinition) {
  return { ...mixin, parameters: mixin.parameters ?? [] }
}

export function compactConditions(conditions: MasterCSSManifestConditions | undefined) {
  return Object.entries(conditions || {}).map(([name, rule]) => ({
    name,
    id: rule.id,
    nodes: rule.nodes,
    nodeCount: rule.nodes.length
  }))
}
