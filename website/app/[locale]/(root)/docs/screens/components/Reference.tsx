import DocTable from 'websites/components/DocTable'
import { variables } from '@master/css'
import descriptions from '../descriptions'

export default () => {
    return (
        <DocTable>
            <thead>
                <tr>
                    <th className='w:0'>Token</th>
                    <th className='w:0'>Pixels</th>
                    <th className='w:0'>REM</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {
                    Object.entries(variables.screen)
                        .map(([name, value], index) => (
                            <tr key={index}>
                                <th className="white-space:nowrap"><code>screen-{name}</code></th>
                                <td><code className='token number'>{value}<span className='token unit'>px</span></code></td>
                                <td><code className='token number'>{value / 16}<span className='token unit'>rem</span></code></td>
                                <td>{descriptions[name as keyof typeof descriptions]}</td>
                            </tr>
                        ))
                }
            </tbody>
        </DocTable>
    )
}