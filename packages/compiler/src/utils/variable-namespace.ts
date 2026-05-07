import { utilities, UtilityType, variables } from '@master/css'

const variableNamespaces = variables
    .map(({ namespace }) => namespace)
    .filter(Boolean) as string[]

const dottedNamespaceAliases = Object.fromEntries(
    variableNamespaces
        .filter((namespace) => namespace.includes('.'))
        .map((namespace) => [namespace.replace(/\./g, '-'), namespace])
)

const namespaces = Array.from(new Set([
    ...utilities
        .filter(({ type }) => type !== UtilityType.Static)
        .map(({ name }) => name),
    ...variableNamespaces,
    ...Object.keys(dottedNamespaceAliases),
    'screen',
    'radius'
])).sort((a, b) => b.length - a.length)

const namespaceAliases: Record<string, string> = {
    ...dottedNamespaceAliases,
    radius: 'border-radius'
}

export interface VariableNamespace {
    name: string
    namespace?: string
    group?: string
    key: string
}

export default function resolveVariableNamespace(customProperty: string): VariableNamespace {
    const name = customProperty.replace(/^--/, '')
    const matchedNamespace = namespaces.find((eachNamespace) => name.startsWith(eachNamespace + '-'))

    if (!matchedNamespace) {
        return { name, key: name }
    }

    const namespace = namespaceAliases[matchedNamespace] ?? matchedNamespace
    const key = name.slice(matchedNamespace.length + 1)
    const normalizedPrefix = namespace.replace(/\./g, '-')

    return {
        name: matchedNamespace === normalizedPrefix ? name : normalizedPrefix + '-' + key,
        namespace,
        group: namespace,
        key
    }
}
