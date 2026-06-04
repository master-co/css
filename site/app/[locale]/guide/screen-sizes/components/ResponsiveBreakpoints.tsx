import { generateAt, parseAt } from '@master/css/utils'
import css from '~/site/common/theme-css'
import InlineCode from '~/internal/components/InlineCode'
import { screenVariableEntries } from '~/site/utils/screen-variables'

const formatValue = (value: number) => `${value}px / ${value / 16}rem`

export default () => {
    return (
        <figure className="doc-table">
            <table>
                <thead>
                    <tr>
                        <th className="w:0">Token</th>
                        <th className="w:0">Value</th>
                        <th>CSS</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        screenVariableEntries.map(([name, value]) => (
                            <tr key={name}>
                                <th className="white-space:nowrap"><InlineCode>{`@${name}`}</InlineCode></th>
                                <td className="white-space:nowrap"><InlineCode>{formatValue(value)}</InlineCode></td>
                                <td><InlineCode lang="css">{generateAt(parseAt('@' + name, css))}</InlineCode></td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </figure>
    )
}
