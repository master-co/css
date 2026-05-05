import { utilities, UtilityType } from '@master/css'
import ExpandContent from '~/internal/components/ExpandContent'
import InlineCode from '~/internal/components/InlineCode'

const Definitions = () =>
    <figure>
        <ExpandContent className="doc-table">
            <table>
                <thead>
                    <tr>
                        <th className="w:0 sticky-th">Name</th>
                        <th className="sticky-th">Type</th>
                        <th className="sticky-th">Unit</th>
                        <th className="sticky-th">Variable namespaces</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        utilities
                            .filter((utility) => utility.type !== UtilityType.Static)
                            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                            .map((utility) => {
                                return (
                                    <tr key={utility.name}>
                                        <th><InlineCode className="white-space:nowrap">{utility.name}</InlineCode></th>
                                        <td>
                                            {utility.type
                                                ? <code>{UtilityType[utility.type]}</code>
                                                : <span className="fg:lightest">-</span>}
                                        </td>
                                        <td>
                                            {utility.unit
                                                ? <InlineCode>{utility.unit}</InlineCode>
                                                : <span className="fg:lightest">-</span>}
                                        </td>
                                        <td>
                                            {utility.namespaces
                                                ? <InlineCode>{utility.namespaces.join(', ')}</InlineCode>
                                                : <span className="fg:lightest">-</span>}
                                        </td>
                                    </tr>
                                )
                            })
                    }
                </tbody>
            </table>
        </ExpandContent>
    </figure>

export default Definitions
