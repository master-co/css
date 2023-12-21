import { mediaQueries } from '@master/css'
import InlineCode from 'websites/components/InlineCode'
import DocTable from 'websites/components/DocTable'
import descriptions from '../../screen-sizes/descriptions'

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
                    ...Object.keys(mediaQueries)
                        .map((eachBreakpointName) => {
                            // @ts-ignore
                            const eachBreakpoint = mediaQueries[eachBreakpointName]
                            return (
                                <tr key={eachBreakpointName}>
                                    <th>{eachBreakpointName}</th>
                                    <td>
                                        <div className='token number'>{eachBreakpoint}<span className='token unit'>px</span></div>
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