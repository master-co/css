import css from '~/site/common/theme-css'
import ExpandContent from '~/internal/components/ExpandContent'
import InlineCode from '~/internal/components/InlineCode'

function formatVariableValue(variable: { value?: unknown, modes?: unknown }) {
    const value = variable.value ?? variable.modes
    return value === undefined ? 'undefined' : JSON.stringify(value, null, 2)
}

export default () =>
    <figure>
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
                                        <td><InlineCode lang="ts" className='word-break:break-all'>{formatVariableValue(variable)}</InlineCode></td>
                                        <td><code className='white-space:nowrap'>{variable?.namespace || '-'}</code></td>
                                    </tr>
                                )
                            })
                    }
                </tbody>
            </table>
        </ExpandContent>
    </figure>
