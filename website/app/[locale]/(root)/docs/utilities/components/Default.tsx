import { utilities } from '@master/css'
import InlineCode from 'websites/components/InlineCode'

export default () => <table>
    <thead>
        <tr>
            <th className="w:0">Syntax</th>
            <th>CSS Declarations</th>
        </tr>
    </thead>
    <tbody>
        {
            Object.keys(utilities)
                .map((eachUtilityName) => {
                    // @ts-ignore
                    const eachUtility = utilities[eachUtilityName]
                    return (
                        <tr key={eachUtilityName}>
                            <td>
                                <InlineCode lang="mcss">{eachUtilityName}</InlineCode>
                            </td>
                            <td>
                                <InlineCode lang="css" className="white-space:pre">{
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