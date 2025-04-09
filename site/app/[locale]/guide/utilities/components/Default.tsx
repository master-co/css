import { utilities } from '@master/css'
import InlineCode from 'internal/components/InlineCode'

export default () => <table>
    <thead>
        <tr>
            <th className="w:0">Token</th>
            <th>CSS declarations</th>
        </tr>
    </thead>
    <tbody>
        {
            Object.keys(utilities)
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                .map((eachUtilityName) => {
                    // @ts-ignore
                    const eachUtility = utilities[eachUtilityName]
                    return (
                        <tr key={eachUtilityName}>
                            <th>
                                <InlineCode className="white-space:nowrap">{eachUtilityName}</InlineCode>
                            </th>
                            <td>
                                <InlineCode className="white-space:pre">{
                                    Object.keys(eachUtility)
                                        .map((eachUtilityKey) => {
                                            const eachUtilityValue = (eachUtility as any)[eachUtilityKey]
                                            return `${eachUtilityKey}: ${eachUtilityValue};`
                                        })
                                        .join('\n')
                                }</InlineCode>
                            </td>
                        </tr>
                    )
                })
        }
    </tbody>
</table>