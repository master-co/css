import variableNamespaces from '../variable-namespaces'
import utilities from '../utilities'
import UtilityType from 'shared/utility-type'

const implicitVariableNamespaces = utilities
    .filter((utility) => utility.type !== UtilityType.Static && !utility.name.endsWith('()'))
    .map((utility) => utility.name)

const namespaces = [
    ...new Set([
        ...variableNamespaces,
        ...implicitVariableNamespaces,
    ])
].sort((a, b) => b.length - a.length)

export interface ResolvedVariableNamespace {
    name: string
    namespace?: string
    key: string
}

export default function resolveVariableNamespace(customProperty: string): ResolvedVariableNamespace {
    const name = customProperty.replace(/^--/, '')
    const matchedNamespace = namespaces.find((eachNamespace) => name.startsWith(eachNamespace + '-'))

    if (!matchedNamespace) {
        return { name, key: name }
    }

    return {
        name,
        namespace: matchedNamespace,
        key: name.slice(matchedNamespace.length + 1)
    }
}
