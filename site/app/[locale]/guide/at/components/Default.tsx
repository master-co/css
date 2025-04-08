import { at } from '@master/css'
import DocTable from 'internal/components/DocTable'
import InlineCode from 'internal/components/InlineCode'

export default () =>
    <DocTable>
        <thead>
            <tr>
                <th>Token</th>
                <th>CSS text</th>
            </tr>
        </thead>
        <tbody>
            {
                [
                    ...Object.keys(at)
                        .map((eachBreakpointName) => {
                            // @ts-ignore
                            const eachBreakpoint = at[eachBreakpointName]
                            return (
                                <tr key={eachBreakpointName}>
                                    <th><code>{eachBreakpointName}</code></th>
                                    <td>
                                        <InlineCode>{eachBreakpoint}</InlineCode>
                                    </td>
                                </tr>
                            )
                        })
                ]
            }
        </tbody>
    </DocTable>