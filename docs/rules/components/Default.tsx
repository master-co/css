import { rules } from '@master/css'
import DotJoin from 'shared/components/DotJoin'

const Default = () => <table>
    <thead>
        <tr>
            <th className="w:0">Rule</th>
            <th>Unit</th>
            <th>Values</th>
        </tr>
    </thead>
    <tbody>
        {
            Object.keys(rules)
                .map((eachRuleName) => {
                    // @ts-ignore
                    const eachRule = rules[eachRuleName]
                    return (
                        <tr key={eachRuleName}>
                            <td><code className='fg:code-blue'>{eachRuleName}</code></td>
                            <td>
                                {
                                    eachRule.unit
                                        ? <code className='fg:code-pink'>{eachRule.unit}</code>
                                        : <span className='fg:dim'>-</span>
                                }
                            </td>
                            <td>
                                {eachRule.variables
                                    ? (
                                        <code className='fg:inherit'>
                                            <DotJoin>{Object.keys(eachRule.variables)}</DotJoin>
                                        </code>
                                    )
                                    : <span className='fg:dim'>-</span>}
                            </td>
                        </tr>
                    )
                })
        }
    </tbody>
</table>

export default Default