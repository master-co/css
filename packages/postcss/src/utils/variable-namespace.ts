import { rules, variables } from '@master/css'

const objectVariableNamespaces = Object.entries(variables)
    .filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))
    .map(([key]) => key)

const namespaces = Array.from(new Set([
    ...Object.keys(rules),
    ...objectVariableNamespaces,
    'screen',
    'radius'
])).sort((a, b) => b.length - a.length)

const namespaceAliases: Record<string, string> = {
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

    return {
        name: matchedNamespace === namespace ? name : namespace + '-' + key,
        namespace,
        group: namespace,
        key
    }
}
