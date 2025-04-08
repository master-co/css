import { MasterCSS } from '@master/css'

const css = new MasterCSS()

export default () => <table>
    <thead>
        <tr>
            <th className="w:0">Variable</th>
            <th className="w:0">Type</th>
            <th className="w:0">Group</th>
            <th>Value</th>
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
                            <td><code>{variable?.type}</code></td>
                            <td><code>{variable?.group}</code></td>
                            <td><code className='word-break:break-all'>{variable?.value}</code></td>
                        </tr>
                    )
                })
        }
    </tbody>
</table>