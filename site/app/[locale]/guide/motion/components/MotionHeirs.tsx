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
                            const ruleNames = rules
                                .filter((rule) => rule.namespaces?.includes(namespace))
                                .map(({ name }) => name)

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
