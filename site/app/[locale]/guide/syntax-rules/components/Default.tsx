import { rules, SyntaxRuleType } from '@master/css'
import ExpandContent from '~/internal/components/ExpandContent'
import InlineCode from '~/internal/components/InlineCode'

const Default = () =>
    <figure>
        <ExpandContent className="doc-table">
            <table>
                <thead>
                    <tr>
                        <th className="sticky-th w:0">Name</th>
                        <th className='sticky-th'>type</th>
                        <th className='sticky-th'>Unit</th>
                        <th className='sticky-th'>Variable Namespaces</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        Object.keys(rules)
                            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                            .map((eachSyntaxName) => {
                                const rule = rules[eachSyntaxName as keyof typeof rules] as unknown as any
                                return (
                                    <tr key={eachSyntaxName}>
                                        <th><InlineCode className='white-space:nowrap'>{eachSyntaxName}</InlineCode></th>
                                        <td>
                                            {rule.type
                                                ? <code>{SyntaxRuleType[rule.type]}</code>
                                                : <span className='fg:lightest'>-</span>}
                                        </td>
                                        <td>
                                            {rule.unit
                                                ? <InlineCode>{rule.unit}</InlineCode>
                                                : <span className='fg:lightest'>-</span>}
                                        </td>
                                        <td>
                                            {rule.namespaces
                                                ? <InlineCode>{rule.namespaces.join(', ')}</InlineCode>
                                                : <span className='fg:lightest'>-</span>}
                                        </td>
                                    </tr>
                                )
                            })
                    }
                </tbody>
            </table>
        </ExpandContent>
    </figure>

export default Default