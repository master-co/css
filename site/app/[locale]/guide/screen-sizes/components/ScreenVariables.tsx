import InlineCode from '~/internal/components/InlineCode'
import { screenVariableEntries } from '~/site/utils/screen-variables'

const formatRem = (value: number) => `${value / 16}rem`
const formatValue = (value: number) => `${value}px / ${formatRem(value)}`

export default () => {
    return (
        <figure className="doc-table">
            <table>
                <thead>
                    <tr>
                        <th className="w:0">Token</th>
                        <th className="w:0">Value</th>
                        <th>Example CSS</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        screenVariableEntries.map(([name, value]) => (
                            <tr key={name}>
                                <th className="white-space:nowrap"><InlineCode>{`screen-${name}`}</InlineCode></th>
                                <td className="white-space:nowrap"><InlineCode>{formatValue(value)}</InlineCode></td>
                                <td><InlineCode lang="css">{`{ max-width: ${formatRem(value)} }`}</InlineCode></td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </figure>
    )
}
