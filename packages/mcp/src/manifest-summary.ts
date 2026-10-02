import type {
  MasterCSSManifest,
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
      utilities: manifest.utilities?.length ?? 0,
      customMedia: Object.keys(manifest.customMedia || {}).length,
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
