import config from '@master/css/config'
import InlineCode from 'internal/components/InlineCode'

const atTokens = config.atTokens || {}

export default () =>
    <figure className='doc-table'>
        <table>
            <thead>
                <tr>
                    <th>Token</th>
                    <th>CSS text</th>
                </tr>
            </thead>
            <tbody>
                {
                    [
                        ...Object.entries(atTokens)
                            .map(([tokenName, tokenValue]) => {
                                return (
                                    <tr key={tokenName}>
                                        <th><code>{tokenName}</code></th>
                                        <td>
                                            <InlineCode>{tokenValue}</InlineCode>
                                        </td>
                                    </tr>
                                )
                            })
                    ]
                }
            </tbody>
        </table>
    </figure>
