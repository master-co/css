import { queries } from '@master/css'
import InlineCode from 'websites/components/InlineCode'
import DocTable from 'websites/components/DocTable'
import descriptions from '../../screens/descriptions'

export default () =>
    <DocTable>
        <thead>
            <tr>
                <th>Token</th>
                <th>Size</th>
                <th>Devices</th>
            </tr>
        </thead>
        <tbody>
            {
                [
                    ...Object.keys(queries)
                        .filter((eachBreakpointName) => typeof queries[eachBreakpointName as keyof typeof queries] === 'number')
                        .map((eachBreakpointName) => {
                            // @ts-ignore
                            const eachBreakpoint = queries[eachBreakpointName]
                            return (
                                <tr key={eachBreakpointName}>
                                    <th><code>{eachBreakpointName}</code></th>
                                    <td>
                                        <code className='token number'>{eachBreakpoint}<span className='token unit'>px</span></code>
                                    </td>
                                    <td>
                                        {descriptions[eachBreakpointName as keyof typeof descriptions]}
                                    </td>
                                </tr>
                            )
                        })
                ]
            }
        </tbody>
    </DocTable>