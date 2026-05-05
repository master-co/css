import { atTokens } from '@master/css'
import InlineCode from 'internal/components/InlineCode'

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
                        ...Object.keys(atTokens)
                            .map((tokenName) => {
                                const tokenValue = atTokens[tokenName]
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
