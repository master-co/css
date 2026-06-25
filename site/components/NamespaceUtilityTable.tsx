import type { ReactNode } from 'react'
import InlineCode from '~/internal/components/InlineCode'
import { getVariableNamespacePublicKeys } from '~/site/utils/manifest-utilities'

export interface NamespaceUtilityGroup {
    label: string
    keys: string[]
    namespace?: string
    namespaces?: string[]
    description?: ReactNode
}

interface NamespaceUtilityTableProps {
    groups: NamespaceUtilityGroup[]
}

export default function NamespaceUtilityTable(props: NamespaceUtilityTableProps) {
    const groups = props.groups
        .map((group) => ({
            ...group,
            keys: filterNamespaceKeys(group)
        }))
        .filter((group) => group.keys.length)
    const hasDescriptions = groups.some((group) => group.description)

    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Group</th>
                            <th>Utility keys</th>
                            {hasDescriptions && <th>Description</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {
                            groups.map((group) => (
                                <tr key={group.label}>
                                    <th className="white-space:nowrap">{group.label}</th>
                                    <td>{renderKeys(group.keys)}</td>
                                    {hasDescriptions && <td>{group.description}</td>}
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </figure>
    )
}

function filterNamespaceKeys(group: NamespaceUtilityGroup) {
    const namespaces = group.namespaces || (group.namespace ? [group.namespace] : [])
    if (!namespaces.length) return group.keys

    const namespaceKeys = new Set(namespaces.flatMap((namespace) => getVariableNamespacePublicKeys(namespace)))
    return group.keys.filter((key) => namespaceKeys.has(key))
}

function renderKeys(keys: string[]) {
    return keys.map((key, index) => (
        <span key={key}>
            <InlineCode>{key}</InlineCode>
            {index !== keys.length - 1 && ', '}
        </span>
    ))
}
