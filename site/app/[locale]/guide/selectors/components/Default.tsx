import { selectors } from '@master/css'
import InlineCode from 'internal/components/InlineCode'

export default () => <table>
    <thead>
        <tr>
            <th className="w:0">Token</th>
            <th>Selector Text</th>
        </tr>
    </thead>
    <tbody>
        {
            Object.keys(selectors)
                .map((eachSelectorName) => {
                    // @ts-ignore
                    const eachSelector = selectors[eachSelectorName]
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