import type { MasterCSSManifest } from './master-css-manifest.js'

type ManifestUtility = NonNullable<MasterCSSManifest['utilities']>[number]
type ManifestVariables = NonNullable<MasterCSSManifest['variables']>
type ManifestVariable = ManifestVariables[string][number]

function getVariableName(namespace: string, variable: Pick<ManifestVariable, 'key' | 'name'>) {
    return variable.name || (namespace ? `${namespace}${variable.key ? '-' + variable.key : ''}` : variable.key)
}

function normalizeTemplateDeclarations(declarations: Record<string, unknown>) {
    const normalized: Record<string, unknown> = {}
    for (const propertyName in declarations) {
        const value = declarations[propertyName]
        normalized[propertyName] = Array.isArray(value)
            ? value.map((part) => part === undefined ? null : part)
            : value === undefined
                ? null
                : value
    }
    return normalized
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

function normalizeUtilityForJSON(utility: ManifestUtility): ManifestUtility {
    const normalized: ManifestUtility = { ...utility }
    if (normalized.name === normalized.id) delete normalized.name
    if (normalized.layer === 'utilities') delete normalized.layer
    delete normalized.order
    if (normalized.emit.type !== 'template') return normalized
    return {
        ...normalized,
        emit: {
            ...normalized.emit,
            declarations: normalizeTemplateDeclarations(normalized.emit.declarations as Record<string, unknown>)
        }
    }
}

export function normalizeMasterCSSManifestForJSON(manifest: MasterCSSManifest): MasterCSSManifest {
    return {
        ...manifest,
        ...(manifest.variables ? { variables: normalizeVariablesForJSON(manifest.variables) } : {}),
        ...(manifest.utilities?.length ? { utilities: manifest.utilities.map(normalizeUtilityForJSON) } : {})
    }
}

export function stringifyMasterCSSManifestJSON(manifest: MasterCSSManifest): string {
    return JSON.stringify(normalizeMasterCSSManifestForJSON(manifest))
}
