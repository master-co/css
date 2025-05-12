import { functions } from '@master/css'
import InlineCode from 'internal/components/InlineCode'
import ExpandContent from '~/internal/components/ExpandContent'

export default () =>
    <ExpandContent className="doc-table">
        <table>
            <thead>
                <tr>
                    <th className="w:0">Token</th>
                    <th className="w:0">Unit</th>
                    <th>CSS text</th>
                </tr>
            </thead>
            <tbody>
                {
                    Object.keys(functions)
                        .map((eachFunctionName) => {
                            // @ts-ignore
                            const eachFunction = functions[eachFunctionName]
                            return (
                                <tr key={eachFunctionName}>
                                    <th>
                                        <InlineCode className="white-space:nowrap">{eachFunctionName + '()'}</InlineCode>
                                    </th>
                                    <td>
                                        {eachFunction.unit
                                            ? <code>{eachFunction.unit}</code>
                                            : <span className='fg:lightest'>-</span>
                                        }
                                    </td>
                                    <td>
                                        {
                                            <code>{eachFunctionName + '()'}</code>
                                        }
                                    </td>
                                </tr>
                            )
                        })
                }
            </tbody>
        </table>
    </ExpandContent>