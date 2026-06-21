import type { MasterCSSManifestUtility } from '@master/css'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }

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
