import config from '@master/css/config'

const namespaces = ['duration', 'easing']
const utilities = config.utilities || []

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
                            const utilityNames = utilities
                                .filter((utility) => utility.namespaces?.includes(namespace))
                                .map(({ name }) => name)

                            return (
                                <tr key={namespace}>
                                    <th>{namespace}</th>
                                    <td>
                                        {
                                            utilityNames.map((utilityName, index) => (
                                                <span key={utilityName}>
                                                    <code>{utilityName}</code>
                                                    {index !== utilityNames.length - 1 && ', '}
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
