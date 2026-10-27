import type { MasterCSSManifest } from './manifest.js'

type ManifestVariables = NonNullable<MasterCSSManifest['variables']>
type ManifestVariable = ManifestVariables[string][number]

function getVariableName(namespace: string, variable: Pick<ManifestVariable, 'key' | 'name'>) {
  return variable.name || (namespace ? `${namespace}${variable.key ? '-' + variable.key : ''}` : variable.key)
}

function normalizeVariablesForJSON(variables: ManifestVariables | undefined): ManifestVariables | undefined {
  if (!variables) return
  const normalized: ManifestVariables = {}
  for (const [namespace, definitions] of Object.entries(variables)) {
    const nextDefinitions = definitions.map((definition) => {
      const normalizedDefinition: typeof definition = { ...definition }
      if (normalizedDefinition.namespace === namespace || !namespace) delete normalizedDefinition.namespace
      if (normalizedDefinition.name === getVariableName(namespace, normalizedDefinition)) {
        delete normalizedDefinition.name
      }
      if (normalizedDefinition.type === 'string') delete normalizedDefinition.type
      return normalizedDefinition
    })
    if (nextDefinitions.length) normalized[namespace] = nextDefinitions
  }
  return Object.keys(normalized).length ? normalized : undefined
}

export function normalizeMasterCSSManifest(manifest: MasterCSSManifest): MasterCSSManifest {
  return {
    ...manifest,
    ...(manifest.variables ? { variables: normalizeVariablesForJSON(manifest.variables) } : {})
  }
}

export function serializeMasterCSSManifest(manifest: MasterCSSManifest): string {
  return JSON.stringify(normalizeMasterCSSManifest(manifest))
}
