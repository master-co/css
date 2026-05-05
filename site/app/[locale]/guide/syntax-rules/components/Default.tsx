import { rules, SyntaxRuleType } from '@master/css'
import ExpandContent from '~/internal/components/ExpandContent'
import InlineCode from '~/internal/components/InlineCode'

const Default = () =>
    <figure>
        <ExpandContent className="doc-table">
            <table>
                <thead>
                    <tr>
                        <th className="w:0 sticky-th">Name</th>
                        <th className='sticky-th'>type</th>
                        <th className='sticky-th'>Unit</th>
                        <th className='sticky-th'>Variable Namespaces</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        rules
                            .filter((rule) => rule.type !== SyntaxRuleType.Utility)
                            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                            .map((rule) => {
                                return (
                                    <tr key={rule.name}>
                                        <th><InlineCode className='white-space:nowrap'>{rule.name}</InlineCode></th>
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
