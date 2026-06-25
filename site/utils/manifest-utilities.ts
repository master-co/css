import type { MasterCSSManifestUtility } from '@master/css'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { builtinKeyAliases, builtinNativeValueNamespaces } from '@master/css-engine'

export const manifestUtilities = defaultManifest.utilities || []

export function getUtilityVariableNamespaces(utility: MasterCSSManifestUtility) {
    return [
        ...(utility.namespaces || []),
        ...(utility.variableAliasRefs || []).map((ref) => ref.replace(/^[=~]/, ''))
    ].filter((namespace, index, namespaces) => namespaces.indexOf(namespace) === index)
}

export function utilityUsesVariableNamespace(utility: MasterCSSManifestUtility, pattern: string) {
    return getUtilityVariableNamespaces(utility).some((namespace) => namespace.includes(pattern))
}

export function getNativeValueNamespacePublicKeys(namespace: string) {
    const properties = new Set<string>()
    for (const eachNamespace of builtinNativeValueNamespaces) {
        if (!eachNamespace.variableAliasRefs.some((ref) => normalizeNamespaceRef(ref) === namespace)) continue
        for (const property of eachNamespace.properties) {
            if (property) properties.add(property)
        }
    }

    const keys = new Set<string>()
    for (const [alias, property] of Object.entries(builtinKeyAliases)) {
        if (properties.has(property)) keys.add(alias)
    }
    for (const property of properties) {
        keys.add(property)
    }

    return Array.from(keys)
        .filter((key) => key && !key.includes('<~'))
        .sort((a, b) => a.localeCompare(b))
}

function normalizeNamespaceRef(ref: string) {
    return ref.replace(/^[=~]/, '')
}
