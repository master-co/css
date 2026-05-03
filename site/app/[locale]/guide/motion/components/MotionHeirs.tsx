import { rules } from '@master/css'

const namespaces = ['duration', 'easing']

export default () =>
    <figure>
        <div className="doc-table">
            <table>
                <thead>
                    <tr>
                        <th>Namespace</th>
                        <th>Rules</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        namespaces.map((namespace) => {
                            const ruleNames = Object.keys(rules)
                                .filter((ruleName) => (rules as any)[ruleName].namespaces?.includes(namespace))

                            return (
                                <tr key={namespace}>
                                    <th>{namespace}</th>
                                    <td>
                                        {
                                            ruleNames.map((ruleName, index) => (
                                                <span key={ruleName}>
                                                    <code>{ruleName}</code>
                                                    {index !== ruleNames.length - 1 && ', '}
                                                </span>
                                            ))
                                        }
                                    </td>
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>
        </div>
    </figure>
