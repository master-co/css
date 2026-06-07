import config from '@master/css/config'
import InlineCode from '~/internal/components/InlineCode'

const utilities = config.utilities || []
const MAX_VISIBLE_UTILITIES = 8

const namespaceEntries = Array
    .from(utilities.reduce((entries, utility) => {
        for (const namespace of utility.namespaces || []) {
            const utilityNames = entries.get(namespace)
            if (utilityNames) {
                utilityNames.push(utility.name)
            } else {
                entries.set(namespace, [utility.name])
            }
        }
        return entries
    }, new Map<string, string[]>()))
    .sort(([a], [b]) => a.localeCompare(b))

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
                                    <th><InlineCode>{`--${namespace}-*`}</InlineCode></th>
                                    <td>Utility-defined namespace</td>
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
