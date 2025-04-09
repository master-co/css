import { rules, SyntaxRuleType } from '@master/css'
import InlineCode from '~/internal/components/InlineCode'

const Default = () => <table>
    <thead>
        <tr>
            <th className="w:0">Name</th>
            <th>type</th>
            <th>Unit</th>
            <th>Variables</th>
        </tr>
    </thead>
    <tbody>
        {
            Object.keys(rules)
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                .map((eachSyntaxName) => {
                    const rule = (rules as any)[eachSyntaxName]
                    return (
                        <tr key={eachSyntaxName}>
                            <th><InlineCode className='white-space:nowrap'>{eachSyntaxName}</InlineCode></th>
                            <td>
                                {rule.type
                                    ? <code>{SyntaxRuleType[rule.type as keyof typeof SyntaxRuleType]}</code>
                                    : <span className='fg:lightest'>-</span>}
                            </td>
                            <td>
                                {rule.unit
                                    ? <InlineCode>{rule.unit}</InlineCode>
                                    : <span className='fg:lightest'>-</span>}
                            </td>
                            <td>
                                {rule.variables
                                    ? <InlineCode lang="ts" beautify>{JSON.stringify(rule.variables)}</InlineCode>
                                    : <span className='fg:lightest'>-</span>}
                            </td>
                        </tr>
                    )
                })
        }
    </tbody>
</table>

export default Default