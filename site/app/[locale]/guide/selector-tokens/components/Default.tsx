import config from '@master/css/config'
import InlineCode from 'internal/components/InlineCode'

const selectorTokens = config.selectorTokens || {}

export default () =>
    <figure className='doc-table'>
        <table>
            <thead>
                <tr>
                    <th className="w:0">Token</th>
                    <th>Selector Text</th>
                </tr>
            </thead>
            <tbody>
                {
                    Object.keys(selectorTokens)
                        .map((eachSelectorName) => {
                            // @ts-ignore
                            const eachSelector = selectorTokens[eachSelectorName]
                            return (
                                <tr key={eachSelectorName}>
                                    <th>
                                        <code className="white-space:nowrap">{eachSelectorName}</code>
                                    </th>
                                    <td>
                                        <InlineCode>{eachSelector}</InlineCode>
                                    </td>
                                </tr>
                            )
                        })
                }
            </tbody>
        </table>
    </figure>
