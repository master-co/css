import { rules, SyntaxRuleType } from '@master/css'
import InlineCode from 'internal/components/InlineCode'
import ExpandContent from '~/internal/components/ExpandContent'

const utilities = Object.fromEntries(
    rules
        .filter((definition) => definition.type === SyntaxRuleType.Utility)
        .map((definition) => [
            definition.name,
            ('declarations' in definition ? definition.declarations : {}) as Record<string, string | number>
        ])
)

export default () =>
    <figure>
        <ExpandContent className="doc-table">
            <table>
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
        </ExpandContent>
    </figure>
