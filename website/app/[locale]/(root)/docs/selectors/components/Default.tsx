import { selectors } from '@master/css'
import InlineCode from 'websites-shared/components/InlineCode'

export default () => <table>
    <thead>
        <tr>
            <th className="w:0">Selectors</th>
            <th>Replace with</th>
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
                            <td>
                                <InlineCode lang="mcss">{eachSelectorName}</InlineCode>
                            </td>
                            <td>
                                <InlineCode lang="js" beautify>{`
                                    ${JSON.stringify(eachSelector)}
                                `}</InlineCode>
                            </td>
                        </tr>
                    )
                })
        }
    </tbody>
</table>