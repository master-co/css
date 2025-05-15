import css from '~/internal/common/css'
import ExpandContent from '~/internal/components/ExpandContent'
import InlineCode from '~/internal/components/InlineCode'

export default () =>
    <ExpandContent className="doc-table">
        <table>
            <thead>
                <tr>
                    <th className="w:0">Variable Name</th>
                    <th>Value</th>
                    <th className="w:0">Namespace</th>
                </tr>
            </thead>
            <tbody>
                {
                    Object.values(Object.fromEntries(css.variables))
                        .filter((variable) => (variable.type === 'string' || variable.type === 'number') && variable.name.charAt(0) !== '-')
                        .map((variable) => {
                            return (
                                <tr key={variable?.name}>
                                    <th><code className='white-space:nowrap'>{variable?.name}</code></th>
                                    <td><InlineCode lang="ts" className='word-break:break-all'>{JSON.stringify(variable?.value, null, 2)}</InlineCode></td>
                                    <td><code className='white-space:nowrap'>{variable?.namespace || '-'}</code></td>
                                </tr>
                            )
                        })
                }
            </tbody>
        </table>
    </ExpandContent>