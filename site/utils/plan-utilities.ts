import { defaultPlan, type MasterCSSPlanUtility } from '@master/css'

export const planUtilities = defaultPlan.utilities || []

export function getUtilityVariableNamespaces(utility: MasterCSSPlanUtility) {
    return [
        ...(utility.namespaces || []),
        ...(utility.variableAliasRefs || []).map((ref) => ref.replace(/^[=~]/, ''))
    ].filter((namespace, index, namespaces) => namespaces.indexOf(namespace) === index)
}

export function utilityUsesVariableNamespace(utility: MasterCSSPlanUtility, pattern: string) {
    return getUtilityVariableNamespaces(utility).some((namespace) => namespace.includes(pattern))
}
