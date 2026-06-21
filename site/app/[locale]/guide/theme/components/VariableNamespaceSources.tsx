import InlineCode from '~/internal/components/InlineCode'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { builtinNativeValueNamespaces } from '@master/css-engine'
import { getUtilityVariableNamespaces, manifestUtilities } from '~/site/utils/manifest-utilities'

const utilities = manifestUtilities
const MAX_VISIBLE_UTILITIES = 8

const namespaceEntries = (() => {
    const entries = new Map<string, string[]>()
    for (const variable of defaultManifest.variables || []) {
        if (variable.namespace) {
            addNamespaceSource(entries, variable.namespace, 'theme tokens')
        }
    }
    for (const namespace of builtinNativeValueNamespaces) {
        for (const ref of namespace.variableAliasRefs || []) {
            const variableNamespace = ref.replace(/^[=~]/, '')
            for (const property of namespace.properties) {
                addNamespaceSource(entries, variableNamespace, property)
            }
        }
    }
    for (const utility of utilities) {
        for (const namespace of getUtilityVariableNamespaces(utility)) {
            addNamespaceSource(entries, namespace, utility.name)
        }
    }
    return Array.from(entries).sort(([a], [b]) => a.localeCompare(b))
})()

export default function VariableNamespaceSources() {
    return (
        <figure>
            <div className="doc-table">
                <table>
                    <thead>
                        <tr>
                            <th>Namespace</th>
                            <th>Source</th>
                            <th>Used by</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th><InlineCode>breakpoint</InlineCode></th>
                            <td>Built-in condition namespace</td>
                            <td>
                                <InlineCode>@md</InlineCode>
                                {', '}
                                <InlineCode>@&lt;md</InlineCode>
                                {', '}
                                <InlineCode>@sm&amp;&lt;lg</InlineCode>
                            </td>
                        </tr>
                        {
                            namespaceEntries.map(([namespace, utilityNames]) => (
                                <tr key={namespace}>
                                    <th><InlineCode>{`${namespace}-*`}</InlineCode></th>
                                    <td>Default registry namespace</td>
                                    <td>{renderUtilityNames(utilityNames)}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </figure>
    )
}

function addNamespaceSource(entries: Map<string, string[]>, namespace: string, source: string) {
    if (namespace === 'breakpoint') return
    const sources = entries.get(namespace)
    if (sources) {
        if (!sources.includes(source)) sources.push(source)
    } else {
        entries.set(namespace, [source])
    }
}

function renderUtilityNames(utilityNames: string[]) {
    const visibleUtilityNames = utilityNames.slice(0, MAX_VISIBLE_UTILITIES)
    const hiddenUtilityCount = utilityNames.length - visibleUtilityNames.length

    return (
        <>
            {
                visibleUtilityNames.map((utilityName, index) => (
                    <span key={utilityName}>
                        <InlineCode>{utilityName}</InlineCode>
                        {index !== visibleUtilityNames.length - 1 && ', '}
                    </span>
                ))
            }
            {hiddenUtilityCount > 0 && ` and ${hiddenUtilityCount} more`}
        </>
    )
}
